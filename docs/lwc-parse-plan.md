# LWC の parse の実装方針（計画）

Lightning Web Components（`force-app/main/default/lwc/<名前>/`）の JS / TS / HTML / CSS / XML を、Apex・オブジェクトと同じ流れ（構文解析 → 中間表現 → `kind` / `sourceKeys` 付き JSON）で読むための方針。実装はまだしていない（ライブラリの導入と、下の「確認済み」の動作確認だけをした）。

## 1. 全体の流れとライブラリ

```text
ソース (LF にそろえる)
  │ ① 構文解析（ライブラリの AST）           ② Salesforce 仕様の検証（LWC Compiler）
  ▼                                            ▼
lwc_IR（中間表現。位置を SourcePosition にそろえる）   診断 → resolvedError
  │ ③ converter（IR → JSON の材料、ソース位置の登録）
  ▼
types/lwc（kind / sourceKeys 付き JSON）→ バンドル（フォルダ）ごとに LwcBundleStructureType → msgpack で保存
```

| ファイル       | ① 構文解析                                                                          | ② 仕様の検証                                       | 導入                                                       |
| -------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `.js`          | `@babel/parser`（`decorators`）                                                     | `@lwc/compiler`（`transformSync`）                 | `@babel/parser` 8.0.7 は既存、`@lwc/compiler` 9.5.1 を追加 |
| `.ts`          | `@babel/parser`（`typescript` と `decorators`）。**JS と同じ parser・同じ中間表現** | 型を空白にした JS を `@lwc/compiler` で検証（3.2） | 同上                                                       |
| `.html`        | `parse5`（`parseFragment`、位置付き）                                               | `@lwc/template-compiler`（`parse`）                | parse5 8.1.0 を追加（template-compiler 9.5.1 は既存）      |
| `.css`         | `postcss`（`parse`）                                                                | `@lwc/style-compiler`（`transform`）               | style-compiler 9.5.1 を追加（postcss は既存）              |
| `.js-meta.xml` | 自前の `parseXml`（[types/commons/xml.ts](../src/analyzer/types/commons/xml.ts)）   | なし（ルート要素と値の確認だけ）                   | 既存                                                       |

- **JS と TS は Babel に決めた**（SWC との比較は [lwc-js-parser-evaluation.md](./lwc-js-parser-evaluation.md)）。理由は、情報の欠けがないこと、位置が Apex の `SourcePosition` と同じ形で変換が要らないこと、LWC Compiler と同じ parser であること。`@swc/core` は削除した。
- 各ライブラリが返す parse の結果（ノードの種類・属性・位置の表し方）は [lwc-library-attributes.md](./lwc-library-attributes.md)（サンプルのバンドルと、実行のスクリプト `docs/examples/lwc/run-library-parse.ts`）。
- **コメントは今回は対象外**にする（JSDoc も読まない。Babel は `attachComment: false` で、ノードにコメントを付けない）。
- **parse はバンドル（`lwc/<名前>/` のフォルダ）ごと**に行い、解析結果・保存・Diff もバンドルを単位にする（4 章。オブジェクトのフォルダ単位と同じ）。
- TS の AST は JS の AST に型のノード（`TSTypeAnnotation` など）を足したものなので、中間表現（`lwc_IR`）と JSON を作る処理を 1 つにし、TS のときだけ型の情報を足す（3.1）。
- TypeScript Compiler API は使わない（package.json の `typescript` 7.0.2 は Go 版で Compiler API を持たない）。そのため、型の推論（型注釈のない項目の型、戻り値の推論）は行わない（3.1.4）。

### 1.1 確認済みのこと（実装前に試した結果）

| 項目                                 | 結果                                                                                                                                                                                                                                                                                                                                     | 実装への影響                                                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Babel の位置                         | 各ノードの `start` / `end`（文字位置）と `loc`（`{ line（1 始まり）, column（0 始まり）, index }`）。Apex の `SourcePosition` と同じ形                                                                                                                                                                                                   | 変換せずに `SourcePosition` にする（2.2）                                                                                   |
| Babel のトークン                     | `tokens: true` で全トークンの位置（コメントは今回は対象外なので `attachComment: false` にする）                                                                                                                                                                                                                                          | span のない記号（`?` / `!`）・修飾子の位置はトークンから取る（3.2）                                                         |
| Babel の TS の AST                   | 型のノード（`TSTypeAnnotation` は `:` を含む、`TSAsExpression`、`TSNonNullExpression`、`TSTypeParameterDeclaration` など）。Babel 8 では型引数は `typeArguments`、`implements` は `TSClassImplements`、オーバーロード・`abstract` のメソッドは `TSDeclareMethod`、`this` パラメーターは `params` の最初の `Identifier`（`name: 'this'`） | 3.1.4・3.2                                                                                                                  |
| Babel の括弧                         | 既定では括弧をノードにせず `extra.parenthesized` だけになる                                                                                                                                                                                                                                                                              | `createParenthesizedExpressions: true` を付ける（付けないと `<T>(x as U)` の `(` まで空白にしてしまうことを検証で見つけた） |
| `@lwc/compiler`                      | 内部で Babel（`@babel/core` 7.29、`decorators: { decoratorsBeforeExport: true }`、TypeScript なし）を使う。`.ts` を渡すと型注釈で構文エラー（`LWC1007`）                                                                                                                                                                                 | parse の設定を LWC Compiler に合わせる。TS は型を空白にしてから検証する                                                     |
| 型を空白で塗りつぶす方式             | **検証スクリプト [docs/examples/lwc/verify-erase-types.ts](./examples/lwc/verify-erase-types.ts) で確認済み**（3.2.1）                                                                                                                                                                                                                   | 3.2                                                                                                                         |
| parse5                               | 位置は文字位置、行・列は 1 始まり。`<template>` の中は `content` に入る。属性ごとの位置（`sourceCodeLocation.attrs`）がある。属性名・タグ名は小文字になる                                                                                                                                                                                | 列は 0 始まりに直す。大文字の属性（`onClick`）は parse5 では区別できないので、検証は template-compiler の診断に任せる       |
| `@lwc/template-compiler` の `parse`  | 例外を投げず `warnings` を返す（`code`、`level`、`message`、`location: { line, column, start, length }`）。AST にも位置がある                                                                                                                                                                                                            | 診断をそのまま resolvedError にする                                                                                         |
| `postcss`                            | `source.start` / `source.end` が `{ line, column, offset }`。end は最後の文字を指す（含む）                                                                                                                                                                                                                                              | end は `offset + 1`、列は 0 始まりに直す                                                                                    |
| `@lwc/style-compiler` の `transform` | **最初のエラー 1 件で例外を投げる**。位置はメッセージの `path:行:列:` にしか入らない                                                                                                                                                                                                                                                     | メッセージから位置を取り出す。1 件しか報告できないことを仕様として書く                                                      |
| `@lwc/compiler` の `transformSync`   | 正常時は `{ code, map }`、違反は例外（`LWC1102` など。`location: { line, column, start, length }` 付き）                                                                                                                                                                                                                                 | 例外の 1 件を resolvedError にする                                                                                          |

## 2. 共通部品

### 2.1 置き場所

| 層             | 置き場所                            | 内容                                                                                                                   |
| -------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 中間表現（IR） | `src/analyzer/types/lwc_IR/`        | ライブラリの AST から作る木（3 章）。Apex の `apex_IR` に当たる                                                        |
| converter      | `src/analyzer/types/lwc/converter/` | IR → CommonType（JSON を作る材料）。Apex の `apex/converter` に当たる                                                  |
| JSON の型      | `src/analyzer/types/lwc/`           | kind ごとの `*Json` と `make*Json`                                                                                     |
| parser         | `src/analyzer/parser/Lwc/`          | `LwcParser`。バンドルのフォルダを読み、ファイルごとに①②③を実行して `LwcBundleStructureType` にまとめる。保存・読み込み |
| 検証           | `src/analyzer/parser/Lwc/validate/` | LWC Compiler の呼び出しと、診断 → resolvedError                                                                        |

### 2.2 位置（SourcePosition）

すべての IR・JSON の位置は、Apex と同じ `SourcePosition`（`offset` は **文字位置**、`line` は 1 始まり、`column` は 0 始まり）にそろえる。`types/commons/source.ts` に、位置の変換部品を足す。

| 部品                                                             | 内容                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `makeLineIndex(source)`                                          | 文字位置 → 行・列（`xml.ts` の `makePositionOf` を共通にする）                                                                 |
| `fromBabelLocation(node)`                                        | Babel の `start` / `end` と `loc` を `{ start, end }: SourcePosition` にする（`loc.start.index` → `offset`。行・列はそのまま） |
| `fromParse5Location` / `fromPostcssSource` / `fromLwcDiagnostic` | 各ライブラリの位置を `SourcePosition` にする                                                                                   |

### 2.3 JSON とソース位置

- オブジェクトの `makeXmlJson` / `XmlSourceRegistry` は、XML に限らない（ファイルのパスと開始・終了位置から sourceKey を作るだけ）。名前を `makeSourceJson` / `SourceRegistry`、`XmlFile` を `SourceFile` にして共通に使う（`types/commons/xmlJson.ts` から `types/commons/sourceJson.ts` へ分ける）。
- `objectKey` は内容（`sourceKeys` を除く）のハッシュ、`sourceKey` はファイルと位置のハッシュ（Apex・オブジェクトと同じ）。
- ソースは LF にそろえてから読む（`readSource`）。

### 2.4 解析結果と resolvedError

解析結果はバンドル（フォルダ）に 1 つ。オブジェクト（`ObjectFileStructureType`）と同じく、フォルダの中の複数のファイルを 1 つの JSON にまとめる。

```ts
type LwcBundleStructureType = {
    filePath: string;                 // バンドルのフォルダ（lwc/hello）
    resolvedError: LwcResolvedError[]; // バンドルの中のすべてのファイルの診断（filePath で区別する）
    dataType: 'lwcBundle';
    result: {
        id: string;                   // バンドル名（hello）
        base: LwcBundleJson;
        sourceObject: SourceObject[]; // filePath 付き（オブジェクトの XmlSourceJson と同じ形）
    };
};
type ErrorLwcBundleStructureType = { ...; dataType: 'error'; result: { base: ErrorJson; ... } }; // フォルダ自体が読めないとき

type LwcResolvedError = {
    sourceKeys: ConvertKeys;
    phase: 'syntax' | 'lwc' | 'analyzer'; // ① 構文エラーか、② LWC の仕様違反か、IR を作れなかった (このアナライザの未対応・例外。3.1.7)
    code: string;                     // 'JS_SYNTAX' / 'TS_SYNTAX' / 'HTML_SYNTAX' / 'CSS_SYNTAX' / 'XML_SYNTAX' / LWC のコード ('LWC1102' など) / 'TS_UNSUPPORTED' / IR の ErrorCode
    level: 'error' | 'warning';
    contextType: string;              // 詳しい種類 (Babel の reasonCode、空白にできない構文の名前、IR を作れなかったノードの type など)
    context: string;                  // エラーの位置のソース
    errorMessage: string;
    filePath: string;                 // バンドルのフォルダの親からの相対パス（hello/hello.js）
    start: SourcePosition;
    end: SourcePosition;
};
```

`LwcBundleJson`（kind `lwcBundle`）は、バンドルの中のファイルを種類ごとに持つ（ないものは持たない。オブジェクトの子の配列と同じ）。

| プロパティ           | 中身                                                                                                                    | 3 章 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---- |
| `name` / `namespace` | バンドル名（`hello`）、名前空間（`c`）                                                                                  |      |
| `modules`            | JS / TS のモジュール（`lwcModule`）。メインのモジュール（`<名前>.ts` / `.js`）と共有のモジュール。`main` でメインを示す | 3.1  |
| `templates`          | テンプレート（`lwcTemplate`）。`<名前>.html` と、`render()` で切り替えるほかの `.html`                                  | 3.3  |
| `stylesheets`        | CSS（`lwcStylesheet`）                                                                                                  | 3.4  |
| `meta`               | `<名前>.js-meta.xml`（`lwcBundleMeta`）                                                                                 | 3.5  |
| `skippedFiles`       | 読まなかったファイルと理由（`.ts` から生成された `.js` など。4.2）                                                      |      |

- 読めなかったファイルは、その配列に `ErrorJson`（`kindType` は読もうとした kind）として入れ、`resolvedError` に理由を入れる（オブジェクトの子のファイルと同じ）。構文エラー（①）のファイルは `ErrorJson`、仕様違反（②）だけのファイルは JSON を作ったうえで `resolvedError` に入れる（Apex の構文エラーと同じ扱い）。
- バンドルのフォルダ自体が読めない（フォルダがない・メインのモジュールがない）ときだけ、全体を `dataType: 'error'` にする。
- `resolvedError` の `sourceKeys` は `error_${hash(内容)}` / `error_${hash(位置)}`（`toApexResolvedError` と同じ）。
- `sourceKey` はファイルのパスと位置から作る（オブジェクトと同じ）。同じバンドルの別のファイルの同じ位置でも、別の値になる。

## 3. ファイルごとの方針

### 3.1 JavaScript / TypeScript（`.js` / `.ts`）

JS と TS は同じ parser（`@babel/parser`）・同じ中間表現・同じ JSON で扱い、TS のときだけ型の情報と型の宣言を足す。

#### 3.1.1 ① 構文解析

```ts
const BABEL_OPTIONS = {
    sourceType: 'module',
    plugins: [/* .ts のときだけ */ 'typescript', ['decorators', { decoratorsBeforeExport: true }]],
    errorRecovery: true, // 回復できるエラーは、複数件を報告して AST も返す
    attachComment: false, // コメントは今回は対象外
    tokens: true, // span のない記号・修飾子の位置 (3.2)
    createParenthesizedExpressions: true, // 括弧をノードにする (3.2)
};
```

- デコレーターの設定は LWC Compiler と同じ（`decoratorsBeforeExport: true`）。
- 構文エラー: 回復できないもの（式の欠けなど）は例外になるので、`JS_SYNTAX` / `TS_SYNTAX` にしてファイル全体を `dataType: 'error'` にする。回復できたもの（`ast.errors`。同じ名前の `let`、クラスの外の `super` など）は、JSON を作ったうえで resolvedError（`phase: 'syntax'`）に入れる。
- 位置は Babel の `start` / `end` / `loc` をそのまま使う（2.2）。
- `@babel/parser` 8 は ESM のみ（このリポジトリは ESM なので問題ない）。LWC Compiler の中の Babel（7.29）とは別のものを使う。

#### 3.1.2 中間表現と converter（Apex と同じ流れ。実装済み）

**Apex と同じく、IR → converter → JSON の流れにする**（`ModuleIR` のような解析用の中間層は作らない。解析に使うものを取り出す処理は、Apex の `make*Json` と同じく JSON の層に置く）。

| 段                                   | Apex                                                                                                                                  | LWC（JS / TS）                                                                                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. IR                                | `types/apex_IR/`（`UnitVisitor`）                                                                                                     | `types/lwc_IR/`（`StandardizedVisitor` の `File`）                                                                                                                                                                                                                        |
| 2. converter（IR → CommonType）      | `types/apex/converter/`（`convertApexUnit`。IR のフィールドをそのまま写す 1 つの変換。名前の違うところだけ `APEX_CONVERT_OVERRIDES`） | `types/lwc/converter/`（`convertLwcFile`。1 つの変換。出力の型 `LwcXxxType` は生成した `nodes.ts`）                                                                                                                                                                       |
| 3. objectKey / sourceKey・ソース位置 | `makeConvertType`（`types/apex/commons`）。JSON の前に、ノードの `sourceInfo` を sourceKey と SourceJson に分ける                     | **JSON を作る段階で分ける**（`LwcJsonContext.keysOf`）。converter の出力は `sourceInfo` を持ったままで、JSON の層はソースの文字列を `sourceInfo` から読む。キーの作り方は `makeConvertType` と同じ（`sourceInfo` に `filePath` があるので、sourceKey はファイルごとに別） |
| 4. JSON（CommonType → `*Json`）      | `types/apex/*.ts`（`makeCompilationUnitJson` など）                                                                                   | `types/lwc/*.ts`（`makeLwcModuleJson` など。3.1.6）                                                                                                                                                                                                                       |
| 5. JSON に残ったソース位置だけにする | `regenerateSourceObjects`                                                                                                             | 不要（`keysOf` を呼んだノード = JSON で使ったノードの位置だけが登録される）                                                                                                                                                                                               |

**IR（`types/lwc_IR/`）**: Babel のノード 1 種類につき 1 つのクラス（`ClassMethodTypeClass` など。JS / TS / Flow / JSX のすべてのノードと、非推奨の別名）。`@babel/types` の `NODE_FIELDS` から生成する。Apex の IR との対応:

| 項目                     | Apex（`apex_IR`）                                                | LWC（`lwc_IR`）                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 置き場所                 | `<分類>Visitor/`（`statementVisitor/` など）                     | `<alias>Visitor/`（`expressionVisitor/` など。Babel の alias ごと）。複数の alias に入るノードは `commons/`                              |
| 公開                     | `export * from './statementVisitor'`                             | `export * as expressionVisitor from './expressionVisitor'`（同じクラスを複数の alias から再 export するため、名前空間で分ける）          |
| ノードの振り分け         | Visitor の `visitXxx`（ANTLR）                                   | `evaluatePair`（判定とクラスの組）の一覧。一覧は `lazyPairs` で初めて使うときに作る（循環 import のため）                                |
| 子の読み方               | `visitNode` / `visitOptionalNode` / `visitNodeList`              | 同じ名前の `visitNode` / `visitOptionalNode` / `visitNodeList`（と、配列の穴を許す `visitNullableNodeList`）                             |
| 子の型の確認             | `isApexValidClass`。型が違えば `TYPE_MISMATCH`                   | 許す型の pair だけで振り分ける。違えば `UNSUPPORTED_CONTEXT`（**`TYPE_MISMATCH` は出ない**）                                             |
| フィールド               | private の `value` と個別のフィールド、`getValue()` / `getXxx()` | private の `value`（Babel のフィールドの組）、`getFields()` と、Babel のフィールド名の `getXxx()`（`value` フィールドなら `getValue()`） |
| 子のノード               | `getChildNodes()`、`collectErrorTypeClasses()`                   | 同じ                                                                                                                                     |
| span                     | `ApexCommonVisitor.visit` で付ける                               | `visitWithPairs` で付ける                                                                                                                |
| `create` の引数          | `create(ctx)`                                                    | `create(target, originalSource)`（Babel のノードは `getText()` を持たないため）                                                          |
| エラーのリスナー         | `parser/Apex/errorListener.ts` の `ApexCommonErrorListener`      | `parser/Lwc/errorListener.ts` の `LwcCommonErrorListener`                                                                                |
| resolvedError の `phase` | `syntax` / `analyzer`                                            | `syntax` / `lwc` / `analyzer`                                                                                                            |

- 子のノードは TypeClass か `LwcErrorTypeClass`（型の合わないノード・例外。3.1.7）、省略できるフィールドは `null`。
- converter の CommonType は `{ type, sourceInfo, ...Babel のフィールド }`（`type` は IR の type の名前。`classMethod`、`tSTypeReference` など）。
- JSON の層は、Babel のノードの形のまま必要な部分をたどる。式は、名前の参照（`this.foo`）・リテラル・オブジェクトリテラル（`@wire` の設定、`CustomEvent` の設定）だけを構造にし、それ以外は元の文字列（ソース位置から引く）にする。TS の `x as T` / `x!` / `<T>x` は、中の式（`x`）を見る。

#### 3.1.3 ② 仕様の検証

|       | 方法                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.js` | `transformSync(source, filePath, { namespace: 'c', name: <バンドル名> })`                                                                   |
| `.ts` | 型を空白にした JS（3.2）を、`filePath` の拡張子を `.js` にして `transformSync` に渡す。位置は元の TS と同じなので、診断の位置をそのまま使う |

- 例外の `code`（`LWC1102` など）と `location` を `phase: 'lwc'` の resolvedError にする。生成コードは使わない。

#### 3.1.4 型の情報（TS）

TypeScript Compiler API（TypeChecker）は使わず、**Babel の AST にある型注釈だけ**を使う。

| 取れるもの                                                                                            | 取れないもの                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 書かれた型（プロパティ・引数・戻り値・変数の型注釈、`CustomEvent<T>` などの型引数）                   | 型注釈のない項目の推論（`count = 0` → `number`）、戻り値の推論                                                            |
| 同じファイル・ほかの LWC のモジュールで宣言した `interface` / `type` の中身（3.1.5 で名前を解決する） | ライブラリ（`lwc`、`lightning/*`、`@salesforce/*`）の型。Apex の戻り値の型は、Apex の解析と突き合わせて補う（5 章の解析） |

型は文字列（`text`）と、解析に使う形に分けた `TypeIR` の両方で持つ。

| `TypeIR`                 | Babel のノード                                                  | 例                                             |
| ------------------------ | --------------------------------------------------------------- | ---------------------------------------------- |
| `keyword`                | `TSStringKeyword` / `TSNumberKeyword` / `TSUnknownKeyword` など | `string`、`number`、`unknown`                  |
| `reference`              | `TSTypeReference`（`typeName`、`typeArguments`）                | `Row`、`Promise<Row[]>`、`Record<string, Row>` |
| `array`                  | `TSArrayType`                                                   | `Row[]`                                        |
| `union` / `intersection` | `TSUnionType` / `TSIntersectionType`                            | `Row \| undefined`                             |
| `literal`                | `TSLiteralType`                                                 | `'open'`、`1`                                  |
| `object`                 | `TSTypeLiteral`（`members` の名前・型・省略可能）               | `{ data?: Row[]; error?: unknown }`            |
| `function`               | `TSFunctionType`                                                | `(id: string) => void`                         |
| `tuple`                  | `TSTupleType`                                                   | `[string, number]`                             |
| `other`                  | 上以外（条件型・マップ型など）                                  | `text` だけを持つ                              |

型の宣言（`lwcModule` の `typeDeclarations`）は、`interface`（`TSInterfaceDeclaration`。`extends` と `body` の `members`）、`type`（`TSTypeAliasDeclaration`。右辺の `TypeIR`）、`enum`（`TSEnumDeclaration`。メンバーの名前。検証は未対応として報告する。3.2）を、`exported` の有無とともに持つ。

#### 3.1.5 型の名前の解決（TS。バンドルをまたぐ）

`TypeIR` の `reference`（`Row` など）を、どこで宣言された型かに解決する。TypeChecker の代わりに、parse した全モジュールの `imports` と `typeDeclarations` を使う簡単な解決にする。

1. 同じファイルの `typeDeclarations` に同じ名前があれば、それ。
2. `imports` の `local` が同じ名前なら、import 先のモジュールの `exported` の宣言（`c/<名前>` は 4.2 と同じ順で `.ts`、なければ `.js` に解決。相対パスも同じ）。
3. どちらでもなければ、組み込み（`Promise`、`Record` など）か外部モジュールの型として、名前だけを持つ。

- 結果は `typeRef`（`{ module: 'c/utils', name: 'Row' }`）にする。同じバンドルの中のモジュール（相対パスの import）の型は、バンドルの parse のときに解決して JSON に入れる。ほかのバンドル（`c/<名前>`）の型は、全バンドルの parse（ワーカーで並列にできる）のあとに解決し（`processor/Lwc/typeReferences.ts`）、保存する JSON には入れず解析の結果として持つ（ほかのバンドルが変わると変わるため）。
- 再エクスポート（`export { Row } from './types'`）は 1 段だけたどる。

#### 3.1.6 ③ JSON（`types/lwc/`。実装済み）

Apex の JSON（`types/apex/`）と同じ書き方にする。入力は converter の型（`LwcXxxType`。`sourceInfo` を持ったまま。`types/lwc/converter/nodes.ts` は生成スクリプトで作る）で、フィールドを型付きで読む。境界ノードは `convertLwcValue`（Apex の `convertValue` と同じ検査）、sourceKeys は `LwcJsonContext.keysOf`（ノードの `sourceInfo` を sourceKeys と sourceObject に分ける）、ソースの文字列は `LwcJsonContext.textOf`（`sourceInfo.context`）で作る。

| kind                 | 型（Apex で当たるもの）                              | 持つもの                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| （モジュール）       | `LwcModuleJson`（unit。kind・sourceKeys を持たない） | `fileType: 'js'                                                                                                                                                                                                                        | 'ts'`、`imports`、`component`（default export のクラス）、`otherExports`、`declarations`（直下の変数・関数・クラス。export しないものも含む）、TS は `typeDeclarations`、`errors`（直下の IR を作れなかった文） |
| `lwcImport`          | `LwcImportJson`（LWC だけ）                          | `source`、`category`、`specifiers`（`lwcImportSpecifier`: `specifierType` / `local` / `imported` / `typeOnly`）、`typeOnly`、`category` に応じた `apex` / `schema` / `component`                                                       |
| `lwcComponent`       | `LwcComponentJson`（class）                          | `name`、`extend`（継承元）、`mixins`、`implement`（TS）、`block`（メンバー。ソースの順で、IR を作れなかったメンバーはその位置に `ErrorJson`）                                                                                          |
| `lwcField`           | `LwcFieldJson`（field）                              | `name`、`variantType`（TS の型）、`init`（初期値の式の文字列）、`references`（初期値の中の import）、`optional`、`modifier`                                                                                                            |
| `lwcProperty`        | `LwcPropertyJson`（property）                        | getter / setter。`name`、`variantType`、`isGetter` / `getterContent`、`isSetter` / `setterContent`（中身は `modifier`・`body`・`calls`・`events`）。同じ名前の getter と setter は 1 つにする                                          |
| `lwcMethod`          | `LwcMethodJson`（method）                            | `name`、`returnType`、`param`、`async`、`modifier`、`body`、`calls`、`events`                                                                                                                                                          |
| `lwcConstructor`     | `LwcConstructorJson`（constructor）                  | `param`、`modifier`、`calls`、`events`                                                                                                                                                                                                 |
| `lwcParameter`       | `LwcParameterJson`（parameter）                      | `variant`（名前。分割代入は式の文字列）、`variantType`、`optional`、`modifier`                                                                                                                                                         |
| （修飾子）           | `LwcModifiersJson`（ModifiersJson）                  | `access`（public / private / protected）、`declaration`（static / readonly / abstract / override / declare）、`decorator`                                                                                                              |
| `lwcDecorator`       | `LwcDecoratorJson`（annotation）                     | `name`（api / track / wire など）、`arg`、`@wire` は `wire`（`adapter`、`adapterSource`、Apex なら `apex`、`config`）                                                                                                                  |
| `lwcCall`            | `LwcCallJson`（LWC だけ）                            | `callType`（`apex` / `navigate` / `querySelector` / `refs` / `dispatchEvent` / `innerHTML`）、`target`、`apex`、`arg`（引数の式の文字列）、`references`（引数の中の import）                                                           |
| `lwcWireConfig`      | `LwcWireConfigJson`（LWC だけ）                      | `@wire` の設定の 1 項目。`key`、`value`（式の文字列）、`reactive`（`'$recordId'` → `recordId`）、`references`（値の中の import。`fields: [NAME_FIELD]` の項目など）                                                                    |
| `lwcBody`            | `LwcBodyJson`（LWC だけ）                            | メソッド・getter / setter・関数の本体。`statements`（直下の文の数）。中身は sourceObject が持ち、本体が変わると objectKey が変わる（Diff で本体の変更が見える）                                                                        |
| `lwcDeclaration`     | `LwcDeclarationJson`（LWC だけ）                     | モジュールの直下の宣言（StructureJsonType）。`name`、`declarationType`（`variable` / `function` / `class`）、`exported`、変数は `variableKind`・`init`・`references`、関数は `param`・`returnType`・`async`・`body`・`calls`・`events` |
| `lwcEvent`           | `LwcEventJson`（LWC だけ）                           | `new CustomEvent` の `name`、`bubbles`、`composed`、`detail`、`detailType`（TS の `CustomEvent<T>` の `T`）                                                                                                                            |
| `lwcType`            | `LwcTypeJson`（TypeJson）                            | `text` と、中身（`type`: `primitive` / `custom`（`generic`）/ `array` / `union` / `intersection` / `literal` / `object` / `function` / `tuple` / `other`）。型引数・要素型はキーのない中身                                             |
| `lwcTypeDeclaration` | `LwcTypeDeclarationJson`（TS だけ）                  | `name`、`declarationType`（`interface` / `type` / `enum`）、`exported`、`extend`・`members` / `variantType` / `enumMembers`                                                                                                            |

- 名前を持つ宣言（コンポーネント・`lwcField` / `lwcProperty` / `lwcMethod` / `lwcConstructor`・型の宣言）は、Apex の宣言と同じく `StructureJsonType`（`sourceKeys: { base, name }`）。`name` は `string | ErrorJson`。
- 境界ノード（Apex の `convertValue` と同じ）: 宣言（コンポーネント・メソッド・getter / setter）はノード自身だけを検査し（`exclude: 'children'`）、子（名前・引数・型・デコレーター）は子の変換関数が `ErrorJson` にする。`lwcField`・`lwcImport`・`lwcTypeDeclaration`・`lwcType`・`lwcParameter`・`lwcDecorator` は部分木全体を検査する（Apex の field と同じ）。メソッドの本体は IR を作れなかったノードを飛ばして読む。
- 真偽の項目（`typeOnly`・`optional`・`isGetter` など）は、Apex の `isGetter` と同じく常に持つ。
- 順序: `block` はソースの順。Diff では名前で対応付ける（D）。
- バンドル（2.4）の `base` は `{ name, namespace, modules: { fileName, main, module }[], skippedFiles }`。いまは JS / TS のモジュールだけ。回復できない構文エラーのモジュールは、その構文エラーのキーで `ErrorJson` にする。

#### 3.1.7 parser・仕様の検証・エラーの集約（実装）

1 つの JS / TS ファイルを、次の順で読む（`LwcParser.parseScript`）。

```text
ソース (LF にそろえる)
  │ ① parseScript: Babel (errorRecovery: true)
  ├─ 例外 (回復できない構文エラー) ─→ syntax 1 件。IR は作らない (ファイルは error)
  ▼
AST + ast.errors (回復した構文エラー) ─→ syntax
  │ StandardizedVisitor
  ▼
ノードの IR (File) ─→ IR の中の LwcErrorTypeClass ─→ analyzer (構文エラーの位置に重なるものは除く)
  │ ② validateScript: 構文エラーがないときだけ
  │    TS: eraseTypes (同じ AST を使う) ─→ 空白にできない構文は TS_UNSUPPORTED (検証しない)
  │    transformSync (@lwc/compiler) ─→ 例外 (違反の 1 件目) / warnings ─→ lwc
  ▼
LwcCommonErrorListener ─→ LwcResolvedError[] (sourceKeys・filePath 付き)
```

| 部品                      | 置き場所                            | 内容                                                                                                                                                       |
| ------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseScript`             | `parser/Lwc/script.ts`              | 拡張子から言語（`js` / `ts`）を決め、3.1.1 の設定で parse する。例外の構文エラーは捕まえて返す（Babel の例外以外は投げ直す）                               |
| `eraseTypes`              | `parser/Lwc/validate/eraseTypes.ts` | 3.2。検証スクリプトから移した。parse 済みの AST（`tokens: true`）を渡せば parse し直さない                                                                 |
| `validateScript`          | `parser/Lwc/validate/javascript.ts` | `transformSync` を呼び、違反を `LwcDiagnostic`（`code` / `level` / `message` / 文字位置）にそろえる。生成コードは使わない                                  |
| `LwcCommonErrorListener`  | `parser/Lwc/errorListener.ts`       | 3 つの出どころのエラーを受け取り、`phase` を付けて集める。`getResolvedErrors(filePath)` で `LwcResolvedError[]` にする                                     |
| `LwcParser.parseScript`   | `parser/Lwc/parser.ts`              | 上の流れをつなぐ。結果は `{ filePath, language, ir, resolvedError }`（`ir` は回復できない構文エラーのとき `null`）                                         |
| `LwcParser.selectScripts` | `parser/Lwc/parser.ts`              | バンドルのフォルダから読む JS / TS を選ぶ（4.2: `.ts` を優先し、同じ名前の `.js` は `skippedFiles` にする。`__tests__/`・`*.test.*`・`*.d.ts` は読まない） |

エラーの出どころと resolvedError:

| 出どころ                         | `phase`    | `code`                                   | `contextType`                           | 位置                                                               |
| -------------------------------- | ---------- | ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Babel の例外・`ast.errors`       | `syntax`   | `JS_SYNTAX` / `TS_SYNTAX`                | `reasonCode`（`MissingSemicolon` など） | `loc`（開始位置だけなので、その 1 文字を範囲にする。Apex と同じ）  |
| IR の `LwcErrorTypeClass`        | `analyzer` | `UNSUPPORTED_CONTEXT` / `EXCEPTION` など | ノードの `type`                         | ノードの span                                                      |
| `eraseTypes` の `unsupported`    | `lwc`      | `TS_UNSUPPORTED`                         | 構文（`enum` など）                     | ノードの範囲                                                       |
| `transformSync` の例外・warnings | `lwc`      | `LWC` + 数値（`LWC1093`）                | `LWC` + 数値                            | `location.start` + `length`（なければ `line` / `column`、`index`） |

決めたこと（確認した LWC Compiler 9.5.1 の動作から）:

- **リスナーは `parser/Lwc` に置く**（Apex は `apex_IR/commonVisitor.ts`）。Babel・IR・LWC Compiler の 3 つから受け取るため、IR の層には置かない。`lwc_IR/commonVisitor.ts` の `LwcCommonErrorListener` はこちらへ移した。
- **IR のエラーも resolvedError に出す**（`phase: 'analyzer'`）。Apex では IR のエラーは JSON の中にしか残らず、アナライザの未対応を一覧できなかった。ただし、回復した構文エラーで型の合わないノードになったもの（`1 = 2` の `1`）は、同じ位置の構文エラーで報告済みなので除く（span が構文エラーの位置を含むもの）。
- **構文エラーがあるファイルは LWC の検証をしない**。LWC Compiler の中の Babel は errorRecovery なしなので、同じ構文エラーを `LWC1007` として報告し直すだけになる。
- **LWC の違反は 1 件しか報告できない**。`transformSync` は最初の違反で例外を投げる（`@api @track` が 2 つあっても 1 件）。
- LWC の位置: `location` は `{ line（1 始まり）, column（0 始まり）, start（文字位置、UTF-16）, length }`。日本語・絵文字の後ろでも `start` は正しい。構文エラー（`LWC1007`）だけ `start` の代わりに `index` を持つ。
- LWC のメッセージの先頭の `SyntaxError: <絶対パス>: ` は除く（実行環境に依存するため）。`level` は `Fatal` / `Error` → `error`、`Warning` / `Log` → `warning`。
- `transformSync` に渡すファイル名は、バンドルの中の相対パス（TS は拡張子を `.js` にする）。`name` はバンドル名、`namespace` は `c`。

### 3.2 TS の型を空白にする（検証用）

`@lwc/compiler` は TS を受け付けないので、**型の部分だけを空白に置き換えた JS** を作って検証する（`parser/Lwc/validate/eraseTypes.ts`）。改行は残すので、行・列・文字位置が元の TS と同じになり、LWC の診断の位置をそのまま使える。`ts.transpileModule` のような変換は、デコレーターを書き換えてしまい（`__esDecorate`）、`@api` / `@wire` を LWC Compiler が認識できなくなるので使わない。空白にした JS は検証にだけ使い、JSON・中間表現は元の TS の AST から作る。

Babel の TS の AST（3.1.1 と同じ parse の結果）とトークンをたどり、次の範囲を集めて空白にする。

| 空白にするもの                       | Babel のノード・範囲                                                                                                                                                                                                                                                                             | 例                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 型の宣言・型だけの import / export   | `TSInterfaceDeclaration`、`TSTypeAliasDeclaration`、`ImportDeclaration`（`importKind: 'type'`）、`ExportNamedDeclaration`（`exportKind: 'type'`、または中が型の宣言）                                                                                                                            | `interface Row {…}`、`import type { A }`、`export type T = …`   |
| `{ type A, b }` の `type A`          | `ImportSpecifier` / `ExportSpecifier`（`importKind` / `exportKind: 'type'`）と後ろのカンマ（最後なら前のカンマ）                                                                                                                                                                                 | `import { type Options, getRecord }`                            |
| 宣言だけで実行時に残らないもの       | `declare` の変数・クラス、`TSDeclareFunction`、`TSDeclareMethod`（オーバーロード・`abstract` のメソッド）、`declare` / `abstract` の項目、`TSIndexSignature`                                                                                                                                     | `declare const DEBUG: boolean;`、`overload(x: string): string;` |
| 型注釈・型パラメーター・型引数       | `TSTypeAnnotation`（`:` を含む）、`TSTypeParameterDeclaration`、`TSTypeParameterInstantiation`                                                                                                                                                                                                   | `: string`、`<T,>`、`pick<Row>(…)`、`extends Base<T>`           |
| 型アサーション                       | `TSAsExpression` / `TSSatisfiesExpression` / `TSNonNullExpression` / `TSInstantiationExpression` は、中の式の後ろから最後まで（`as const` も `TSAsExpression`）。`TSTypeAssertion`（`<T>x`）は先頭から中の式の前まで                                                                             | `x as Row`、`x satisfies T`、`x!`、`as const`、`<number>x`      |
| `this` パラメーター                  | `params` の最初の `Identifier`（`name: 'this'`）と後ろのカンマ。型だけを消すと `f(this, n)` になり JS として不正になるため                                                                                                                                                                       | `function f(this: Window, n)`                                   |
| `implements`                         | `implements` のトークンから最後の `TSClassImplements` まで                                                                                                                                                                                                                                       | `implements Local<string>`                                      |
| **記号・修飾子**（ノードを持たない） | `?`（`optional`）・`!`（`definite`）は、名前の後ろから次のノード（型注釈・初期値）の前までの**トークン**。修飾子（`public` / `private` / `protected` / `readonly` / `declare` / `abstract` / `override`）は、デコレーターの後ろから名前の前までのトークン。`abstract class` の `abstract` も同じ | `recordId!: string`、`label?: string`、`private readonly`       |

空白にできない構文（変換すると位置がずれる、または実行時の意味を持つ）は検証せず、`TS_UNSUPPORTED` の resolvedError にする（LWC でも使うべきでない構文）。

| 構文                                                        | Babel のノード                                        |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `enum` / `const enum`                                       | `TSEnumDeclaration`                                   |
| `namespace` / `module`                                      | `TSModuleDeclaration`                                 |
| パラメーター プロパティ（`constructor(private x: number)`） | `TSParameterProperty`                                 |
| `import x = require('y')`                                   | `TSImportEqualsDeclaration`                           |
| `export =` / `export as namespace`                          | `TSExportAssignment` / `TSNamespaceExportDeclaration` |

#### 3.2.1 検証の結果

[docs/examples/lwc/verify-erase-types.ts](./examples/lwc/verify-erase-types.ts)（`npx ttsx --noCheck docs/examples/lwc/verify-erase-types.ts`、`--print` で空白にした JS を表示）で、上の表の構文をひととおり含むコンポーネント（日本語のコメント・サロゲートペアの絵文字・型の語を含む文字列・括弧の後ろの `as` を含む）を使って確かめた。すべて成功。

| 確かめたこと                                                                                           | 結果 |
| ------------------------------------------------------------------------------------------------------ | ---- |
| 空白にした JS の長さ・改行の位置が元と同じで、空白にした文字以外は変わっていない                       | OK   |
| 文字列の中（`'ラベル: as private x?: y'`）、`'$recordId'`、絵文字を消していない                        | OK   |
| 空白にした JS が JavaScript（`typescript` なしの Babel）として parse できる（型が残っていない）        | OK   |
| 空白にした JS が `@lwc/compiler` を通る                                                                | OK   |
| LWC の仕様違反（`@api` と `@track` の併用、`LWC1093`）の位置（5 行 4 列）が、元の TS の位置と一致する  | OK   |
| `enum` / `namespace` / パラメーター プロパティ / `import = require` を空白にできない構文として報告する | OK   |
| 位置（メンバー名の文字位置・行・列）が、日本語・絵文字の後ろでも正しい                                 | OK   |

検証の途中で見つかり、方針に入れたこと:

- `declare const` などの宣言だけの文は、型注釈だけを消すと `declare const DEBUG ;` が残り JS として不正になる → 文ごと消す。
- `this` パラメーターは、型だけを消すと `this` が残り不正になる → 引数ごと消す。
- 括弧をノードにしないと（Babel の既定）、`<number>(row as unknown)` の中の式の位置が括弧の内側になり、`(` まで空白にしてしまう → `createParenthesizedExpressions: true`。
- 文字位置は UTF-16 の単位で扱う（`[...code]` はコードポイント単位になり、絵文字の後ろでずれる）。Babel の位置も UTF-16 の単位。
- 空白にするだけで改行を残すので、自動セミコロン挿入（ASI）の結果は元の TS と変わらない。

### 3.3 HTML（`.html`）

**① 構文解析**: `parseFragment(source, { sourceCodeLocationInfo: true })`。ルートの `<template>` の中身は `content.childNodes`。HTML の構文エラーは parse5 では例外にならない（回復する）ので、`onParseError` で集めて `HTML_SYNTAX` の resolvedError にする（ファイル全体はエラーにしない）。

**中間表現（`lwc_IR/template.ts`）**: parse5 の木を、LWC の意味で分類した木にする。

| IR            | 内容                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TemplateIR`  | ルートの `<template>` の属性（`lwc:render-mode`、`lwc:preserve-comments`）、子                                                                                                                                         |
| `ElementIR`   | `tag`、`kind`（`html` / `component`（`c-*`、`lightning-*` など `-` を含むタグ）/ `slot` / `template`（入れ子の `<template>`））、`attributes`、`directives`、`events`、`children`                                      |
| `AttributeIR` | `name`、値（`static`: 文字列 / `expression`: `{a.b}` を `path: ['a', 'b']` にしたもの）、位置（`sourceCodeLocation.attrs`）                                                                                            |
| `DirectiveIR` | `lwc:if` / `lwc:elseif` / `lwc:else` / `if:true` / `if:false` / `for:each` / `for:item` / `for:index` / `iterator:*` / `key` / `lwc:ref` / `lwc:spread` / `lwc:dom` / `lwc:external` / `lwc:is` / `lwc:slot-data` など |
| `EventIR`     | `on*` の属性（`onselect={handleSelect}` → `event: 'select'`、`handler: 'handleSelect'`）                                                                                                                               |
| `TextIR`      | テキストの中の式（`{item.Name}`）                                                                                                                                                                                      |

- 式は `{` と `}` の間を、ドットでつながった名前の参照として分解する（LWC のテンプレートの式は名前の参照だけ）。分解できないものは `text` のまま持つ。

**② 仕様の検証**: `@lwc/template-compiler` の `parse(source, {})` の `warnings` を、`level` に応じて resolvedError にする（`code` は `LWC1166` などの数値を `LWC` 付きの文字列にする）。template-compiler の AST は使わない（構造は parse5 の IR に統一する）。

**③ JSON（`types/lwc/template.ts`）**

| kind              | 型                                                                              | 持つもの                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lwcTemplate`     | `LwcTemplateJson`                                                               | `renderMode`、`preserveComments`、`children`                                                              |
| `lwcElement`      | `LwcElementJson`                                                                | `tag`、`elementType`、`attributes`、`directives`、`events`、`children`                                    |
| `lwcComponentRef` | （`lwcElement` の `elementType: 'component'` に `component: 'c/child'` を足す） | タグ名から、参照するコンポーネント（`c-child-item` → `c/childItem`、`lightning-card` → `lightning/card`） |

- 子の並びは順序に意味がある（表示順）ので、Diff は Apex の文と同じく順序付き列（C）か GumTree で比べる（[apex-gumtree-diff.md](./apex-gumtree-diff.md)）。テキストだけのノード（空白）は JSON に入れない。

### 3.4 CSS（`.css`）

**① 構文解析**: `postcss.parse(source, { from: filePath })`。構文エラーは `CssSyntaxError`（`line` / `column`）を `CSS_SYNTAX` にし、ファイル全体をエラーにする。

**中間表現**: postcss の AST（`Root` / `Rule` / `AtRule` / `Declaration` / `Comment`）は、すでに小さく位置も持つので、**独自の IR は作らない**。converter が postcss の AST から直接 JSON を作る（位置の変換だけ `fromPostcssSource` を使う）。

**② 仕様の検証**: `@lwc/style-compiler` の `transform(source, filePath, {})`。例外は 1 件だけなので、メッセージの `…:行:列: ` から位置を取り出して resolvedError にする（取り出せなければファイルの先頭）。**違反が複数あっても 1 件しか報告できない**。

**③ JSON（`types/lwc/stylesheet.ts`）**

| kind            | 型                  | 持つもの                                                                                                                       |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `lwcStylesheet` | `LwcStylesheetJson` | `scoped`（`*.scoped.css`）、`imports`（`@import 'c/shared'`）、`rules`                                                         |
| `cssRule`       | `CssRuleJson`       | `selector`（文字列）、`selectors`（カンマで分けたもの）、`declarations`（`{ prop, value, important }`）、`usesHost`（`:host`） |
| `cssAtRule`     | `CssAtRuleJson`     | `name`（`media` など）、`params`、`rules`                                                                                      |

- `declarations` から、使っているカスタムプロパティ（`var(--lwc-*)`、`--slds-*`）と、定義しているカスタムプロパティを取り出せるようにする（スタイリングフックの解析用）。
- 規則の並びは CSS の優先順位に影響するので順序付き列（C）。宣言は同じ規則の中では名前（`prop`）で対応付ける（D。同じ prop が複数あるときは順序付き）。

### 3.5 XML（`<名前>.js-meta.xml`）

**① 構文解析**: 自前の `parseXml`（オブジェクト・Apex の `-meta.xml` と同じ `readXmlFile` / `readXmlRoot`）。ルート要素は `LightningComponentBundle`。

**中間表現**: なし（`XmlElement` がそのまま中間表現。Apex の `-meta.xml` と同じ）。

**② 仕様の検証**: LWC Compiler の対象外。ルート要素の確認（`UNEXPECTED_ROOT`）と XML の構文エラー（`XML_SYNTAX`）だけ。

**③ JSON（`types/lwc/meta.ts`）**

| kind                | 型                      | 持つもの                                                                                                                                 |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `lwcBundleMeta`     | `LwcBundleMetaJson`     | `apiVersion`（文字列）、`isExposed`、`masterLabel`、`description`、`targets`、`targetConfigs`、`capabilities`、`lwr`（`isExposed` など） |
| `lwcTargetConfig`   | `LwcTargetConfigJson`   | `targets`（属性の `targets="lightning__RecordPage"` を分けたもの）、`properties`、`objects`、`supportedFormFactors`                      |
| `lwcTargetProperty` | `LwcTargetPropertyJson` | `name`、`type`、`label`、`default`、`required`、`datasource`、`min` / `max`、`role`                                                      |

- ないものは持たない（オブジェクト・Apex の `-meta.xml` と同じ）。`properties` は `name` で対応付ける（D）。

## 4. 解析の単位と保存

### 4.1 単位

**バンドル（`lwc/<名前>/` のフォルダ）ごとに 1 つの解析結果**にする（オブジェクトのフォルダ単位と同じ）。

- LWC のコンポーネントはバンドルが単位（JS の `@api` と HTML の参照・CSS・js-meta.xml の公開設定がそろって 1 つのコンポーネント）なので、解析・Diff・保存もバンドルを単位にする。
- `id` はバンドル名（`hello`）。保存名は `lwc_<バンドル名>`（`lwc_hello.msgpack`。Apex の `apex_` / `apexMeta_`、翻訳の `objectTranslation_` と同じく接頭辞で分ける）。
- Diff はバンドル名で対応付け、中身はファイルの種類ごとに比べる（`modules` / `templates` / `stylesheets` はファイル名で対応付ける D、`meta` は 1 つ）。バンドル単位の差分は、オブジェクト・翻訳と共通の `makeIdUnitDiffs`（[processor/commons/diff/unit.ts](../src/analyzer/processor/commons/diff/unit.ts)）で作る。JS / TS の Diff の方針は [lwc-diff-policy.md](./lwc-diff-policy.md)。
- 1 ファイルの parse・検証は、バンドルの中でファイルごとに行う（言語ごとの parser・検証は 3 章のまま）。

### 4.2 読むファイル・読まないファイル

| 読む                                                                            | 読まない                                             |
| ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `<名前>.js` / `<名前>.ts`、同じフォルダのほかの `.js` / `.ts`（共有モジュール） | `__tests__/`（Jest のテスト）、`*.test.js`、`*.d.ts` |
| `<名前>.html` と、ほかの `.html`（`render()` で切り替える複数テンプレート）     | `jsconfig.json`、`tsconfig.json`、`.eslintrc*`       |
| `<名前>.css`、`*.scoped.css`                                                    | `<名前>.svg`（アイコン）、`*.md`                     |
| `<名前>.js-meta.xml`                                                            |                                                      |

- **ts を優先し、なければ js を読む**。同じフォルダに同じ名前（拡張子を除く）の `.ts` と `.js` があれば、`.ts` を読み、`.js` は読まない（`.ts` から生成されたデプロイ用の JS と見なす）。`.js` しかなければ `.js` を読む。メインのモジュール（`<名前>.ts` / `<名前>.js`）にも、共有のモジュールにも同じ規則を使う。
- 読まなかった `.js` は、バンドルの JSON の `skippedFiles`（理由: `compiled from <名前>.ts`）に残す。
- import の解決（3.1.5 の型の名前の解決、バンドル間の依存の解析）も同じ順（`.ts` → `.js`）にする。

### 4.3 ワーカー

`WorkerTaskType` に `'Lwc'` を足し、`LwcWorker`（`parseAndSaveAll(rootDir)` は `lwc` フォルダの下のバンドルのフォルダを集める）を作る。1 つのタスクが 1 つのバンドル（オブジェクトの `ObjectWorker` と同じ）。`LwcParser.parseLwcBundle(directory)` が、フォルダの中のファイルを拡張子で ①②③ に振り分ける。

## 5. ファイル構成（予定）

```text
src/analyzer/
├── types/
│   ├── commons/
│   │   ├── source.ts           位置の変換部品を追加（2.2。fromBabelLocation など）
│   │   └── sourceJson.ts       makeXmlJson / XmlSourceRegistry を一般化（2.3）
│   ├── lwc_IR/
│   │   ├── commonVisitor.ts    TypeClass の基底・visit の部品（実装済み）
│   │   ├── <alias>Visitor/ commons/  Babel のノードごとの IR（実装済み。3.1.2）
│   │   ├── template.ts         TemplateIR などの型
│   │   └── fromParse5.ts       parse5 の木 → TemplateIR
│   └── lwc/
│       ├── converter/          IR → CommonType（JS / TS は実装済み。3.1.2）
│       ├── commons.ts          JSON の層の部品（実装済み）
│       ├── module.ts  import.ts  component.ts  typeDeclaration.ts  type.ts  bundle.ts（実装済み。3.1.6）
│       ├── template.ts  stylesheet.ts  meta.ts
│       └── index.ts
├── parser/Lwc/
│   ├── parser.ts               LwcParser（parseScript / convertScript / parseLwcBundle / saveLwcBundle / readLwcMsgPack は実装済み。searchLwcBundles）
│   ├── script.ts               Babel の parse（JS / TS。実装済み。3.1.7）
│   ├── errorListener.ts        LwcCommonErrorListener（実装済み。3.1.7）
│   └── validate/
│       ├── eraseTypes.ts       TS の型を空白にする（実装済み。3.2）
│       ├── javascript.ts       @lwc/compiler の呼び出し（JS / TS。実装済み）
│       ├── template.ts         @lwc/template-compiler の呼び出し
│       └── stylesheet.ts       @lwc/style-compiler の呼び出し
├── processor/Lwc/
│   ├── bundle.ts               バンドルの解析（JS の @api と HTML の参照の突き合わせなど）
│   └── typeReferences.ts       TS の型の名前の解決（3.1.5）
└── worker/lwcWorker.ts
```

## 6. テストとサンプル

- `docs/examples/lwc/before|after/force-app/main/default/lwc/` に、JS のコンポーネント・TS のコンポーネント・複数テンプレート・共有モジュール・`*.scoped.css`・`js-meta.xml` と、各言語の構文エラー・LWC の仕様違反（`LWC1102` のデコレーター、`LWC1055` の大文字の属性、`:root` のセレクター）を置く。
- `run-parse.ts` で JSON と要約（バンドルごとのファイルの件数・kind の件数、resolvedError）を出す。
- TS の型を空白にする処理は、[verify-erase-types.ts](./examples/lwc/verify-erase-types.ts) の構文の一覧をそのままテストにする。
- テストで確かめること:
    - 位置: 日本語・絵文字の後ろでも、Babel の位置（文字位置・行・列）が正しいこと。TS の型を空白にした JS が元と同じ長さ・同じ改行位置で、LWC Compiler の診断の位置が TS の位置と一致すること（3.2.1）
    - キー: 位置だけの変化で objectKey が変わらないこと、CRLF / LF で sourceKey が変わらないこと
    - エラー: 構文エラーはファイル全体が `error`、仕様違反は JSON を作って resolvedError に入ること

## 7. 進め方

1. 共通部品（2.2 の位置の変換、2.3 の一般化、`makeXmlUnitDiffs` の共通化）と、`LwcBundleStructureType` / resolvedError の型
2. XML（3.5）: 既存の部品だけで作れるので最初に作り、parser・保存・ワーカーの骨組みを固める
3. CSS（3.4）: IR なしで作れる
4. JS / TS（3.1）: Babel の IR（JS / TS で共通）と、`lwcModule` の JSON。TS の型を空白にする処理（3.2）は、検証スクリプトの `eraseTypes` を移してテストを足す。続けて型の名前の解決（3.1.5）。**型の名前の解決（3.1.5）以外は実装済み**
5. HTML（3.3）: parse5 の IR と、テンプレートの JSON
6. バンドルの解析と Diff（[report-components-plan.md](./report-components-plan.md) の LWC のコンポーネント）、画面モック（[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)）

## 8. 決めること

- JS / TS の式をどこまで構造にするか（3.1 は名前の参照とリテラルだけ。メソッドの中の制御構造まで見るなら、Apex の文のような JSON が要る）。
- TS で空白にできない構文（`enum` など）を見つけたときに、検証を止めるか、その部分だけ飛ばすか（今の案は、そのファイルの LWC の検証をしない）。
- 型の推論（型注釈のない項目の型）が必要になった場合に、TypeScript Compiler API（5 系）を足すか。今は使わない（3.1.4）。

決めたこと: コメント（JSDoc を含む）は今回は対象外。parse・解析結果・保存・Diff はバンドルごと。
