# LWC converter 出力と module JSON の比較

対象:

- converter 出力: [before/accountList.json](./before/accountList.json)
- 最終 JSON: [../json/before/accountList.json](../json/before/accountList.json) の `result.base.modules` から `fileName: "accountList.ts"` の `module`
- 元ソース: [accountList.ts](../../../repository/before/force-app/main/default/lwc/accountList/accountList.ts)

converter 出力は LWC IR を converter に通した直後の CommonType であり、Babel の構文木に近い形を保つ。一方、module JSON はその CommonType から LWC の解析・Diffで使う情報を抽出・再構成した結果である。したがって、両者は同じノードを同じ形のまま並べたものではない。

## 大きな形の違い

| 観点         | converter 出力                                                                      | 最終 JSON の module                                                                   |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ルート       | `type: "file"` → `program`                                                          | バンドル内のモジュール単位のオブジェクト                                              |
| 主な構造     | `program.body` に import・宣言・クラス・型宣言がソース順で並ぶ                      | `imports`、`component`、`declarations`、`typeDeclarations` など役割別に分ける         |
| ノードの識別 | Babel ノード名を小文字camelCaseにした `type`（例: `classDeclaration`、`decorator`） | LWC向け分類の `kind`（例: `lwcComponent`、`lwcDecorator`）                            |
| ソース位置   | 各ノードに `sourceInfo`（`context`, `start`, `end`, `filePath`）                    | 各ノードに `sourceKeys`。位置やソース文字列はバンドルの `result.sourceObject` に集約  |
| 情報の扱い   | 構文・式・型注釈などの構造を幅広く保持                                              | LWC上の意味に整理し、式を文字列化したり、宣言・呼び出し・wire設定などを抽出したりする |

```text
converter:
File
└─ Program
   └─ body[]
      ├─ ImportDeclaration
      ├─ TypeScript declarations
      └─ ExportDefaultDeclaration
         └─ ClassDeclaration
            └─ ClassBody.body[]

final module:
{
  imports[],
  component: { block[]: fields / methods / properties / ... },
  declarations[],
  typeDeclarations[],
  errors[]
}
```

最終JSONでは、この `module` 自体に `kind` や `sourceKeys` は付かない（モジュールファイル単位の境界データ）。その内側の意味ノードには付与される。

## ノード数の変化

このサンプルの converter 出力には **436個**の `type` 付きノードがある。最終 module JSON には **96個**の `kind` 付きノードがある。最終JSONは構文木全体を複製するのではなく、LWC解析に必要な宣言・属性を選択し、集約するため、数は一致しない。

たとえばconverter側のクラス本体やメソッド本体には `Identifier`、`MemberExpression`、`CallExpression`、`BlockStatement` などの細かな構文ノードが残る。最終JSONではメソッドやアクセサーをLWCのメンバーとして表し、実装本体からは `calls` / `events` と本文の `statements` 数を取り出す。式や本文の文字列・本文自体のソース情報は、必要な範囲で保持する。

## 例: import

converterでは、import文・specifier・識別子が構文要素として別ノードになる。

```json
{
    "type": "importDeclaration",
    "sourceInfo": {
        "context": "import { LightningElement, api, wire, track } from 'lwc';",
        "filePath": "accountList/accountList.ts"
    },
    "specifiers": [
        {
            "type": "importSpecifier",
            "imported": { "type": "identifier", "name": "LightningElement" }
        }
    ],
    "source": { "type": "stringLiteral", "value": "lwc" }
}
```

最終moduleではimportを `lwcImport` にまとめ、specifier名を文字列にし、moduleの分類や型専用importかどうかを付加する。

```json
{
    "kind": "lwcImport",
    "sourceKeys": { "objectKey": "...", "sourceKey": "..." },
    "source": "lwc",
    "category": "lwc",
    "specifiers": [
        {
            "kind": "lwcImportSpecifier",
            "specifierType": "named",
            "local": "LightningElement",
            "imported": "LightningElement",
            "typeOnly": false
        }
    ],
    "typeOnly": false
}
```

## 例: `@wire` デコレーター

converterでは `@wire(...)` は `decorator` ノードで、引数の構文木もそのまま残る。次は `getRecord` に付いた実際のソース範囲と形を簡略化した例。

```json
{
    "type": "decorator",
    "sourceInfo": {
        "context": "@wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD, INDUSTRY_FIELD] })",
        "filePath": "accountList/accountList.ts"
    },
    "expression": {
        "type": "callExpression",
        "callee": { "type": "identifier", "name": "wire" },
        "arguments": [{ "type": "identifier", "name": "getRecord" }, { "type": "objectExpression" }]
    }
}
```

最終moduleではこれを `lwcDecorator` とし、引数は式の文字列として残す。さらに `wire` の意味を解釈して adapter、adapterのimport元、設定項目、リアクティブ参照、schema importへの参照を追加する。

```json
{
    "kind": "lwcDecorator",
    "sourceKeys": { "objectKey": "...", "sourceKey": "..." },
    "name": "wire",
    "arg": ["getRecord", "{ recordId: '$recordId', fields: [NAME_FIELD, INDUSTRY_FIELD] }"],
    "wire": {
        "adapter": "getRecord",
        "adapterSource": "lightning/uiRecordApi",
        "config": [
            { "key": "recordId", "value": "'$recordId'", "reactive": "recordId" },
            {
                "key": "fields",
                "value": "[NAME_FIELD, INDUSTRY_FIELD]",
                "references": [
                    { "local": "NAME_FIELD", "source": "@salesforce/schema/Account.Name" },
                    { "local": "INDUSTRY_FIELD", "source": "@salesforce/schema/Account.Industry" }
                ]
            }
        ]
    }
}
```

このため `decorator.expression.arguments` のASTと `lwcDecorator.wire.config` は同じ構造ではない。後者はLWC固有の意味情報を抽出した表現である。

## クラス・メンバーとTypeScript型

- converterではdefault export、`NavigationMixin(LightningElement)`を継承する `classDeclaration`、`classBody`、その中の `classProperty` / `classMethod` が構文上の入れ子として残る。
- 最終moduleではdefault exportのクラスを `component`（`kind: "lwcComponent"`）にし、メンバーを `block` に並べる。プロパティは `lwcField`、getter/setterは `lwcProperty`、メソッドは `lwcMethod` などに分類し、`@api` やアクセス修飾子は `modifier` にまとめる。
- converterではinterface・type aliasや `TSTypeAnnotation` 以下の型ノードが詳細な構文木として残る。最終moduleではトップレベルのinterface・type aliasを `typeDeclarations` / `lwcTypeDeclaration` に集約し、フィールド・引数などの型注釈は `lwcType` に整理する。
- `init`、式の引数、wire configの値などは、最終JSONではソース文字列で表す場合がある。converter側の式ノードそのものをそのままコピーしたものではない。

## ソース位置の持ち方

converterの `sourceInfo` は各ノードが直接持ち、`context` にそのノードのソース文字列、`start` / `end` に位置、`filePath` にファイルを格納する。

最終JSONでは、意味ノードが `sourceKeys` を持つ。今回の最終JSONでは `result.sourceObject` に **177個**のソースオブジェクトが登録されており、各ノードの位置情報・ソース文字列はそこから参照する。このため同一内容のソース位置を共有しやすく、module本体から長い `context` を分離できる。

## このサンプルでの結果

- `accountList.ts` のBabel構文エラー: 0件
- moduleの `errors`: 0件
- バンドルの `resolvedError`: 0件
- converter側は構文に近いIRを保持し、最終module側はその一部をLWC固有の意味単位に再構成している

## 再生成

converter出力は次のスクリプトで生成する。

```sh
npx ttsx --noCheck docs/examples/lwc/scripts/run-ir-converter.ts
```

最終module JSONを含むサンプル全体は、次のコマンドで再生成する。

```sh
npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts
```
