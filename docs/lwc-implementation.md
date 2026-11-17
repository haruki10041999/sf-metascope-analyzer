# LWC の実装まとめ

Lightning Web Components のバンドル（`force-app/main/default/lwc/<名前>/`）を読み、JSON にし、検証・解析し、前回との差分を取る実装の全体像。Apex・オブジェクトと同じ流れ（構文解析 → `kind` / `sourceKeys` 付き JSON → 解析 → Diff）で作っている。

- JSON の型（JS / TS）: [lwc-json-types.md](./lwc-json-types.md)（今の形は 8 章）。IR のノードの一覧は [lwc-ir-types.md](./lwc-ir-types.md)
- Diff: [processor/Lwc/diff/](../src/analyzer/processor/Lwc/diff/)。本体の文の Diff は [lwc-json-types.md](./lwc-json-types.md) 8.6、サンプルの結果は [examples/lwc/output/diff/summary.md](./examples/lwc/output/diff/summary.md)
- ライブラリが返す parse の結果（JSON にする前の形）: [examples/lwc/output/library/attributes.md](./examples/lwc/output/library/attributes.md)
- 画面モック（未実装の計画）: [lwc-snapshot-plan.md](./lwc-snapshot-plan.md)

## 1. 処理の流れ

```text
lwc/<名前>/ (フォルダ)
   │ readLwcBundleFolder: フォルダを 1 回読み、ファイルを種類ごとに分けて中身も読む (folder.ts)
   ▼
parseLwcBundleFolder (bundle.ts。ファイルシステムに触らない)
   ├─ .js / .ts       Babel → lwc_IR (buildLwcIr) → JSON         / @lwc/compiler で検証
   ├─ .js-meta.xml    parseXml → JSON                            (apiVersion を下の検証に渡す)
   ├─ .html           parse5 の木 → JSON (中間表現なし)          / @lwc/template-compiler で検証
   ├─ .css            postcss の木 → JSON (中間表現なし)         / @lwc/style-compiler で検証
   └─ 同じバンドルの中の突き合わせ (テンプレート × JS × js-meta.xml)
   ▼
LwcBundleParseResult (1 バンドル = 1 解析結果 = 置き場の 1 単位)
   ├─ diff:     makeLwcBundleDiffs (processor/Lwc/diff)
   └─ analysis: analyzeLwcBundles  (processor/Lwc/analysis.ts。バンドルをまたぐ)
```

| ファイル       | 構文解析                                               | 仕様の検証                                                      | 中間表現                       |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------ |
| `.js` / `.ts`  | `@babel/parser`（`errorRecovery`、TS は `typescript`） | `@lwc/compiler` の `transformSync`（TS・Flow は型を空白にして） | `lwc_IR`（Babel のノードごと） |
| `.html`        | `parse5` の `parseFragment`                            | `@lwc/template-compiler` の `parse`                             | なし（parse5 の木から直接）    |
| `.css`         | `postcss` の `parse`                                   | `@lwc/style-compiler` の `transform`                            | なし（postcss の木から直接）   |
| `.js-meta.xml` | 自前の `parseXml`                                      | なし（ルート要素の確認だけ）                                    | なし（`XmlElement`）           |

- **JS / TS は Babel**（SWC と比べて、情報の欠けがない・位置が Apex の `SourcePosition` と同じ形・LWC Compiler と同じ parser）。TypeScript Compiler API は使わないので、型の推論はしない（型注釈だけを使う）。
- **HTML・CSS は中間表現を作らない**（XML のメタデータと同じ方式）。parse5・postcss の木はノードの種類が少なく、LWC の意味は属性名などで決まるため、種類ごとのクラスを作る利点がない。共通部品 `makeSpanJson`（[types/commons/spanJson.ts](../src/analyzer/types/commons/spanJson.ts)）で位置の範囲から JSON を作る。
- **コメントは対象外**（JSDoc・HTML・CSS のコメントは JSON に入れない）。

## 2. 単位とファイル

### 2.1 単位

1 バンドル（`lwc/<名前>/`）= 1 つの解析結果 = 置き場（SQLite）の 1 単位。JS の `@api` と HTML の参照・CSS・js-meta.xml の公開設定がそろって 1 つのコンポーネントなので、解析・Diff・保存もバンドルを単位にする。バンドルのフォルダ自体が読めない・メインのモジュール（`<名前>.ts` / `.js`）がないときだけ、全体を `dataType: 'error'`（`result.base` は null）にする。理由は `resolvedError` の `BUNDLE_UNREADABLE` / `MAIN_MODULE_NOT_FOUND`（4 章）。

### 2.2 読むファイル（[parser/Lwc/folder.ts](../src/analyzer/parser/Lwc/folder.ts)）

| 種類         | ファイル                                                               |
| ------------ | ---------------------------------------------------------------------- |
| `module`     | `.js` / `.ts`（メインと共有のモジュール）                              |
| `template`   | `.html`（`<名前>.html` と、`render()` で切り替えるほかのテンプレート） |
| `stylesheet` | `.css`（`*.scoped.css` を含む）                                        |
| `meta`       | `<名前>.js-meta.xml`                                                   |

- 同じ名前の `.ts` と `.js` があれば `.ts` を読む（`.js` は `.ts` から生成したものとみなす）。
- 読まなかったものはすべて `skippedFiles` に理由付きで残す: `compiled from <名前>.ts` / `test file`（`*.test.js`）/ `type declaration`（`*.d.ts`）/ `folder`（`__tests__/` など）/ `not the bundle metadata` / `not analyzed`（`.svg`・`.md` など）。

## 3. 構成

```text
src/analyzer/
├── types/lwc_IR/               Babel のノードごとの IR (JS / TS / Flow / JSX のすべてのノード。@babel/types から生成)。入口は buildLwcIr (commonVisitor.ts)
├── types/lwc/                  JSON の型と make*Json。IR のノードを直接読む。キーとソース位置は LwcJsonContext (commons.ts)
├── parser/Lwc/
│   ├── parser.ts               LwcParser: searchBundleDirectories / parseLwcBundle / parseLwcBundles /
│   │                           (保存は UnitStore)
│   ├── folder.ts               フォルダを 1 回読む
│   ├── bundle.ts               バンドル 1 つの解析 (ファイルシステムに触らない)
│   ├── module.ts  script.ts    JS / TS の parse・JSON への変換
│   ├── template.ts             HTML の parse・検証
│   ├── stylesheet.ts           CSS の parse・検証
│   ├── meta.ts                 js-meta.xml
│   ├── errorListener.ts        すべてのファイルの診断を LwcResolvedError にそろえる
│   └── validate/               eraseTypes.ts (TS・Flow の型を空白に)・javascript.ts (@lwc/compiler)・bundle.ts (バンドルの中の突き合わせ)
├── processor/Lwc/
│   ├── diff/                   バンドル・モジュール・コンポーネント・テンプレート・CSS・js-meta.xml の差分
│   └── analysis.ts             バンドルをまたぐ解析
└── worker/unitWorker.ts        UnitWorker (すべての単位の種類で共通。1 バンドル = 1 単位)
```

JS / TS の流れは Apex と同じ（IR → JSON。JSON 層が IR のノードを直接読む）。違いは、キーとソース位置の作り方。LWC は JSON を作る段階で `LwcJsonContext.keysOf` が作る（sourceKey にファイルのパスを含める。バンドルの中の別のファイルの同じ位置と分けるため）。

| 段               | Apex                                                                 | LWC（JS / TS）                                    |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| IR               | `types/apex_IR/`（`buildApexIr`）                                    | `types/lwc_IR/`（`buildLwcIr`）                   |
| sourceKeys・位置 | `types/apex/commons/node.ts`（`keysOf`）と `regenerateSourceObjects` | `LwcJsonContext.keysOf`（`types/lwc/commons.ts`） |
| JSON             | `types/apex/*.ts`                                                    | `types/lwc/*.ts`                                  |
| 入口             | `parser/Apex/source.ts`                                              | `parser/Lwc/module.ts`                            |
| リスナー         | `parser/Apex/errorListener.ts`                                       | `parser/Lwc/errorListener.ts`                     |

## 4. 検証と resolvedError

| 出どころ                         | `phase`          | `code`                                        | 備考                                                                                                        |
| -------------------------------- | ---------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Babel の例外・回復した構文エラー | `syntax`         | `JS_SYNTAX` / `TS_SYNTAX`                     | 回復できない構文エラーはモジュールを null にする                                                            |
| IR を作れなかったノード          | `analyzer`       | `UNSUPPORTED_CONTEXT` / `EXCEPTION` など      | 木には残さない。構文エラーのあるファイルでは出さない（構文エラーだけを出す）                                |
| TS の空白にできない構文          | `lwc`            | `TS_UNSUPPORTED`                              | `enum`・`namespace`・パラメーター プロパティ・`import = require` など。そのファイルは LWC の検証をしない    |
| `@lwc/compiler`                  | `lwc`            | `LWC<番号>`                                   | 構文エラーのあるファイルは検証しない（同じ構文エラーを LWC1007 にするだけなので）。違反は 1 件しか出ない    |
| `@lwc/template-compiler`         | `syntax` / `lwc` | `LWC<番号>`                                   | HTML の構文エラー（LWC1058・1075・1078・1079）は `syntax`。例外を投げずにすべての違反を返す。Log は入れない |
| postcss                          | `syntax`         | `CSS_SYNTAX`                                  | スタイルシートを null にする                                                                                |
| `@lwc/style-compiler`            | `lwc`            | `LWC_CSS`                                     | `experimentalErrorRecoveryMode` ですべての違反を取る（番号はない）                                          |
| js-meta.xml                      | `syntax`         | `XML_SYNTAX` / `UNEXPECTED_ROOT`              | `meta` を null にする                                                                                       |
| バンドルの中の突き合わせ（5 章） | `bundle`         | `TEMPLATE_UNKNOWN_*` など                     | すべて `warning`                                                                                            |
| バンドルを読めない               | `bundle`         | `BUNDLE_UNREADABLE` / `MAIN_MODULE_NOT_FOUND` | フォルダが読めない・メインのモジュールがない。バンドル全体を `dataType: 'error'` にする                     |

- **TS の検証**: `@lwc/compiler` は TS を受け付けないので、型の部分だけを空白に置き換えた JS（改行を残すので位置は元の TS と同じ）を検証する（[validate/eraseTypes.ts](../src/analyzer/parser/Lwc/validate/eraseTypes.ts)。検証スクリプトは [verify-erase-types.ts](./examples/lwc/scripts/verify-erase-types.ts)）。`ts.transpileModule` はデコレーターを書き換えるので使わない。Flow（`// @flow` の `.js`）も同じく、flow プラグインで読んだ AST から型（型注釈・型キャストの `: T`・型引数・`type` / `opaque type` / `interface` / `declare` の宣言・`import type` / `import typeof`・variance・`%checks`）を空白にしてから検証する（2026-11-16。それまでは Flow の型が LWC1007 の構文エラーになっていた）。Flow の `enum` は TS の `enum` と同じく空白にできないので、`TS_UNSUPPORTED` を出して検証しない。
- **template-compiler の設定**: `enableDynamicComponents` / `enableLwcOn` は `true`（`lwc:component`・`lwc:on` を違反にしない。使ってよいかはこちらで見る）。`apiVersion` は js-meta.xml の値を渡す。parse5 の `onParseError` は使わない（template-compiler が同じ構文エラーを LWC1058 で返すため）。
- **非推奨の書き方は通す**（`if:true` / `if:false` など。利用者のコードで使われている可能性があるため、エラーにも警告にもしない）。

## 5. 解析

### 5.1 同じバンドルの中（`resolvedError`。[validate/bundle.ts](../src/analyzer/parser/Lwc/validate/bundle.ts)）

| code                        | 条件                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `TEMPLATE_UNKNOWN_MEMBER`   | テンプレートの式（`local: false`）の先頭の名前が、JS のメンバーにない                             |
| `TEMPLATE_UNKNOWN_HANDLER`  | イベントハンドラーが JS のメンバーにない                                                          |
| `TEMPLATE_UNKNOWN_REF`      | JS の `this.refs.<名前>` が、どのテンプレートの `lwc:ref` にもない                                |
| `TEMPLATE_DYNAMIC_DISABLED` | `<lwc:component>` を使うのに、js-meta.xml の capabilities に `lightning__dynamicComponent` がない |

- 継承・mixin のメンバーは JSON にないので、`LightningElement` 以外を継承している・未知の mixin を使うときは、メンバーの確認をしない。
- テンプレートが複数あるときは、すべてをメインのモジュールと突き合わせる。

### 5.2 バンドルをまたぐ（解析の結果。[processor/Lwc/analysis.ts](../src/analyzer/processor/Lwc/analysis.ts)）

`analyzeLwcBundles(bundles, objects?)` はバンドルごとに `LwcBundleAnalysis` を返す。ほかのバンドルの変更で結果が変わるので、`resolvedError` にはしない。

| 結果                     | 内容                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `component`              | ほかのバンドルから見える情報（`@api` のプロパティ、発行するイベント、`<slot>` の名前）                                                |
| `findings`               | 子コンポーネントの `@api`・イベント・slot にないもの、ないバンドル、カタログにない `lightning-*`、メタデータにないオブジェクト・項目  |
| 使っているコンポーネント | `localComponents` / `lightningComponents` / `dataAccessComponents`（データを読み書きする部品）/ `packageComponents`（ほかの名前空間） |
| `metadataDependencies`   | メタデータへの参照（テンプレートの `metadataRefs` と JS の `@salesforce/schema` の import）。式は schema の import から解決する       |

- 子の `@api` にないプロパティでも、HTML の標準のプロパティ（`id` / `title` / `tabIndex` / `aria*` など）は出さない。
- メタデータの解析結果（`ObjectInfo[]`）を渡したときだけオブジェクト・項目を突き合わせる。標準オブジェクト・標準項目はリポジトリにファイルがないのが普通なので確かめず、カスタムのもの（`__c` など）とカスタムオブジェクトの項目だけを確かめる。

## 6. サンプルとテスト

| 内容                           | 場所                                                                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| サンプル・生成スクリプト・出力 | [examples/lwc/](./examples/lwc/)（[examples/README.md](./examples/README.md)）                                                                                                                       |
| テスト                         | `test/parser/lwc-parser.test.ts`・`lwc-bundle-validate.test.ts`、`test/converter/lwc-*.test.ts`、`test/processor/lwc-diff.test.ts`・`lwc-analysis.test.ts`・`lwc-analysis-extra.test.ts`、`test/ir/` |

## 7. 未実装

- **TS の型の名前の解決**（バンドルをまたぐ）。`lwcType` の `custom`（`Row` など）を、宣言したモジュール（`c/utils` の `Row`）に解決する。同じファイル → import → 組み込み・外部の順。ほかのバンドルの型は、保存する JSON に入れず解析の結果として持つ（`processor/Lwc/typeReferences.ts` の予定）。
- 型の推論（型注釈のない項目の型）。必要になったら TypeScript Compiler API（5 系）を足す。

（2026-11-17 時点）ここにあった「JS の本体の文の構造化」は済んだ。文・式は型付きの JSON になり、本体は `block`（文の並び）を持つ。Diff は Apex の本体と同じ形（[lwc-json-types.md](./lwc-json-types.md) 8.6）。
