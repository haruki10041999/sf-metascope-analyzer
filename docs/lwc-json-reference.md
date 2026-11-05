# LWC の JSON リファレンス

LWC のバンドル（`lwc/<名前>/`）の解析結果（`LwcBundleParseResult`）の JSON の型。実装の全体は [lwc-implementation.md](./lwc-implementation.md)、Diff は [lwc-diff-policy.md](./lwc-diff-policy.md)。

共通の約束（Apex・メタデータと同じ）:

- JSON ノードは `kind` と `sourceKeys` を持つ。名前を持つ宣言は `StructureJsonType`（`sourceKeys: { base, name }`）、それ以外は `JsonType`（`sourceKeys: { objectKey, sourceKey }`）。
- `objectKey` は内容（子孫の `sourceKeys` を除く）のハッシュで、キーの順序に依らない。`sourceKey` はファイルのパスと位置のハッシュ（同じバンドルの別のファイルの同じ位置でも別の値）。
- 読めなかったところは `ErrorJson`（`kind: 'error'`、`kindType` は何として読もうとしたか）。理由は `resolvedError` に入る。
- ないものは持たない（ファイルにない値・空の任意の配列）。真偽の項目（`optional`・`isGetter` など）は常に持つ。
- 位置（`sourceObject`）は Apex の `SourceJson` の各位置に `filePath`（バンドルのフォルダの親からの相対パス）を足したもの。ルートの `lwcTemplate` / `lwcStylesheet` と JS のモジュールは、ファイル全体のソースを持たない。

型の置き場所はすべて [src/analyzer/types/lwc/](../src/analyzer/types/lwc/)。

## 1. 解析結果とバンドル

```ts
type LwcBundleParseResult = {
    filePath: string;                  // バンドルのフォルダ
    resolvedError: LwcResolvedError[]; // バンドルの中のすべてのファイルの診断 (filePath で区別)
    dataType: 'lwcBundle' | 'error';   // error はフォルダが読めない・メインのモジュールがないときだけ
    result: { id: string /* バンドル名 */; base: LwcBundleJson | ErrorJson; sourceObject: LwcSourceJson[] };
};
```

`LwcBundleJson`（[bundle.ts](../src/analyzer/types/lwc/bundle.ts)。kind を持たない入れ物）:

| プロパティ           | 中身                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `name` / `namespace` | バンドル名（`hello`）、名前空間（既定は `c`）                                                                              |
| `modules`            | JS / TS のモジュール `{ fileName, main, module: LwcModuleJson \| ErrorJson }[]`。`main` は `<名前>.ts` / `.js`            |
| `templates`          | HTML `{ fileName, main, template: LwcTemplateJson \| ErrorJson }[]`。`main` は `<名前>.html`、ほかは `render()` で切り替える |
| `stylesheets`        | CSS `{ fileName, scoped, stylesheet: LwcStylesheetJson \| ErrorJson }[]`                                                   |
| `meta`               | `<名前>.js-meta.xml`（`LwcBundleMetaJson \| ErrorJson`）。ファイルがなければ持たない                                        |
| `skippedFiles`       | 読まなかったファイル・フォルダと理由（[lwc-implementation.md](./lwc-implementation.md) 2.2）                                |

`LwcResolvedError`（[parser/Lwc/errorListener.ts](../src/analyzer/parser/Lwc/errorListener.ts)）: `sourceKeys`、`phase`（`syntax` / `lwc` / `analyzer` / `bundle`）、`code`、`level`（`error` / `warning`）、`contextType`、`context`（その位置のソース）、`errorMessage`、`filePath`、`start` / `end`。

## 2. JS / TS（`module.ts` ほか）

| kind                 | 型                                                   | 持つもの                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| （モジュール）       | `LwcModuleJson`（kind を持たない）                   | `fileType`（`js` / `ts`）、`imports`、`component`（default export のクラス）、`otherExports`、`declarations`、TS は `typeDeclarations`、`errors`（直下の IR を作れなかった文）                                 |
| `lwcImport`          | `LwcImportJson`                                      | `source`、`category`（`lwc` / `apex` / `schema` / `label` / `component` など）、`specifiers`、`typeOnly`、category に応じて `apex`（クラス・メソッド）/ `schema`（オブジェクト・項目）/ `component`              |
| `lwcImportSpecifier` | `LwcImportSpecifierJson`                             | `specifierType`（`default` / `named` / `namespace`）、`local`、`imported`、`typeOnly`                                                                                                                         |
| `lwcComponent`       | `LwcComponentJson`（Apex の class に当たる）         | `name`、`extend`（継承元。`NavigationMixin(LightningElement)` は `LightningElement`）、`mixins`、`implement`（TS）、`block`（メンバー。ソースの順）                                                            |
| `lwcField`           | `LwcFieldJson`                                       | `name`、`variantType`（TS の型）、`init`（初期値の式の文字列）、`references`（初期値の中の import）、`optional`、`modifier`                                                                                   |
| `lwcProperty`        | `LwcPropertyJson`                                    | getter / setter。`name`、`variantType`、`isGetter` / `getterContent`、`isSetter` / `setterContent`（中身は `modifier`・`body`・`calls`・`events`）。同じ名前の getter と setter は 1 つ                         |
| `lwcMethod`          | `LwcMethodJson`                                      | `name`、`returnType`、`param`、`async`、`modifier`、`body`、`calls`、`events`                                                                                                                                 |
| `lwcConstructor`     | `LwcConstructorJson`                                 | `param`、`modifier`、`body`、`calls`、`events`                                                                                                                                                                |
| `lwcParameter`       | `LwcParameterJson`                                   | `variant`（名前。分割代入は式の文字列）、`variantType`、`optional`、`modifier`                                                                                                                                |
| （修飾子）           | `LwcModifiersJson`                                   | `access`（`public` / `private` / `protected`）、`declaration`（`static` / `readonly` / `abstract` / `override` / `declare`）、`decorator`                                                                     |
| `lwcDecorator`       | `LwcDecoratorJson`                                   | `name`（`api` / `track` / `wire` など）、`arg`、`@wire` は `wire`（`adapter`、`adapterSource`、Apex なら `apex`、`config`）                                                                                   |
| `lwcWireConfig`      | `LwcWireConfigJson`                                  | `@wire` の設定の 1 項目。`key`、`value`（式の文字列）、`reactive`（`'$recordId'` → `recordId`）、`references`                                                                                                 |
| `lwcCall`            | `LwcCallJson`                                        | `callType`（`apex` / `navigate` / `querySelector` / `refs` / `dispatchEvent` / `innerHTML`）、`target`、`apex`、`arg`（引数の式の文字列）、`references`                                                       |
| `lwcEvent`           | `LwcEventJson`                                       | `new CustomEvent` の `name`、`bubbles`、`composed`、`detail`、`detailType`（TS の `CustomEvent<T>` の `T`）                                                                                                   |
| `lwcBody`            | `LwcBodyJson`                                        | 本体の `statements`（直下の文の数）。中身は sourceObject が持ち、本体の文字列が変わると objectKey が変わる                                                                                                     |
| `lwcDeclaration`     | `LwcDeclarationJson`                                 | モジュールの直下の宣言。`name`、`declarationType`（`variable` / `function` / `class`）、`exported`、変数は `variableKind`・`init`・`references`、関数は `param`・`returnType`・`async`・`body`・`calls`・`events` |
| `lwcType`            | `LwcTypeJson`（Apex の type に当たる）               | `text` と中身（`type`: `primitive` / `custom`（`generic`）/ `array` / `union` / `intersection` / `literal` / `object` / `function` / `tuple` / `other`）                                                       |
| `lwcTypeDeclaration` | `LwcTypeDeclarationJson`                             | `name`、`declarationType`（`interface` / `type` / `enum`）、`exported`、`extend`・`members` / `variantType` / `enumMembers`                                                                                   |

- 式は、名前の参照（`this.foo`）・リテラル・オブジェクトリテラル（`@wire` の設定、`CustomEvent` の設定）だけを構造にし、それ以外は元の文字列にする。TS の `x as T` / `x!` / `<T>x` は中の式を見る。
- 型は TS の型注釈だけを使う（型の推論はしない）。

## 3. HTML（`template.ts`）

| kind           | 型                 | 持つもの                                                                                                                                                                                |
| -------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lwcTemplate`  | `LwcTemplateJson`  | `renderMode`（`lwc:render-mode`）、`preserveComments`、`children`                                                                                                                       |
| `lwcElement`   | `LwcElementJson`   | `tag`、`elementType`（下の表）、`component`、`slotName`（`<slot>`）、`metadataRefs`（5 章）、`attributes`、`directives`（制御以外）、`events`、`children`。位置は要素全体（子孫を含む） |
| `lwcAttribute` | `LwcAttributeJson` | `name`、`propertyName`（コンポーネントのタグでプロパティに渡すもの）、`value`                                                                                                           |
| `lwcDirective` | `LwcDirectiveJson` | `name`（`key` / `lwc:ref` / `lwc:dom` / `lwc:spread` / `lwc:is` / `lwc:slot-data` など）、`value`                                                                                       |
| `lwcHandler`   | `LwcHandlerJson`   | `event`（`onselect` → `select`）、`handler`                                                                                                                                             |
| `lwcText`      | `LwcTextJson`      | `text`（連続する空白を 1 つにし、前後を詰めたもの）、`expressions`。空白だけのテキストは入れない                                                                                        |
| `lwcIf`        | `LwcIfJson`        | `branches`（`lwc:if` 〜 `lwc:else` の連なり。`if:true` / `if:false` は 1 つずつ）。位置は最初の分岐から最後の分岐まで                                                                   |
| `lwcBranch`    | `LwcBranchJson`    | `directive`、`condition`（`lwc:else` は持たない）、`children`。位置はディレクティブを付けた要素                                                                                         |
| `lwcForEach`   | `LwcForEachJson`   | `iteratorType`（`for:each` / `iterator`）、`items`、`item` / `index`、`iteratorName`（`iterator:it` の `it`）、`children`                                                               |

- 属性の値（kind なし）: `{ type: 'static', value }` / `{ type: 'expression', expression }` / `{ type: 'boolean' }`。引用符付きの `title="{title}"` は `static`（LWC1034 の違反）。
- 式（kind なし）: `{ text, path?, local }`。`path` は `{row.id}` → `['row', 'id']`（名前の参照でなければ持たない）。`local` は先頭の名前が `for:item` / `for:index` / `iterator:*` で定義した名前か（`false` のものがコンポーネントのメンバーの参照）。
- 制御のディレクティブを付けた要素は、`<template>`（ほかのディレクティブなし）ならその子を、ほかの要素ならその要素を、ブロックの子にする（`<span lwc:if={a}>` は `lwcIf > lwcBranch > lwcElement(span)`）。`for:each` と `lwc:if` が同じ要素なら `lwcForEach > lwcIf`。
- `propertyName` は template-compiler と同じ規則（`@lwc/shared` の表で `tabindex` → `tabIndex`、`aria-*`、それ以外は camelCase）。`class` / `style` / `slot` / `data-*` は持たない。
- コメントは入れない。

タグの種類（`elementType`）:

| 種類                             | 例                                         | `elementType` | `component.source`        |
| -------------------------------- | ------------------------------------------ | ------------- | ------------------------- |
| 標準の HTML                      | `<div>`、`<button>`                        | `html`        | —                         |
| 構造のタグ                       | 入れ子の `<template>`（制御以外）、`<slot>` | `template` / `slot` | —                   |
| 同じ名前空間のコンポーネント     | `<c-account-row>` → `c/accountRow`         | `component`   | `local`                   |
| 基本コンポーネント               | `<lightning-card>` → `lightning/card`      | `component`   | `lightning`               |
| ほかの名前空間                   | `<acme-chart>`                             | `component`   | `package`                 |
| 動的コンポーネント               | `<lwc:component lwc:is={ctor}>`            | `dynamic`     | —                         |
| サードパーティの Web Components  | `<my-widget lwc:external>`                 | `external`    | —                         |

## 4. CSS（`stylesheet.ts`）

| kind            | 型                  | 持つもの                                                                                                                  |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `lwcStylesheet` | `LwcStylesheetJson` | `scoped`（`*.scoped.css`）、`imports`（`@import` の読み込み先）、`rules`                                                  |
| `cssRule`       | `CssRuleJson`       | `selector`（`selectors` を `, ` でつないだもの）、`selectors`、`declarations`、`usesHost`（`:host` を含む）、入れ子の `rules` |
| `cssAtRule`     | `CssAtRuleJson`     | `name`（`media` など）、`params`、中の `rules` / `declarations`（`@font-face` など）                                      |

- 宣言（kind なし）: `{ prop, value, important, uses?, defines? }`。`uses` は値の中の `var(--名前)`、`defines` はカスタムプロパティの定義（`--名前: 値`）。
- セレクター・値は連続する空白を 1 つにして持つ（空白の書き方だけの変更は差分に出ない）。コメントは入れない。

## 5. js-meta.xml と基本コンポーネントのカタログ

`meta.ts`（XML の要素名・属性名をプロパティ名にし、ないものは持たない。Apex の `-meta.xml` と同じ）:

| kind                | 型                      | 持つもの                                                                                                         |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `lwcBundleMeta`     | `LwcBundleMetaJson`     | `apiVersion`（文字列）、`isExposed`、`masterLabel`、`description`、`targets`、`targetConfigs`、`capabilities`    |
| `lwcTargetConfig`   | `LwcTargetConfigJson`   | `targets`（属性 `targets="…"` を分けたもの）、`properties`、`objects`、`supportedFormFactors`                    |
| `lwcTargetProperty` | `LwcTargetPropertyJson` | `<property>` の属性（`name`、`type`、`label`、`default`、`required`、`datasource`、`min` / `max`、`role` など）  |

`lightning-*` のカタログ（[lightning.ts](../src/analyzer/types/lwc/lightning.ts) の `LIGHTNING_COMPONENTS`）は、基本コンポーネントのソースがリポジトリにないので、解析に要る情報だけを手で持つ表。存在するタグの一覧、Salesforce のデータを読み書きする部品か（`dataAccess`）、メタデータを参照する属性を持つ。npm の `lightning-base-components` からは作らない（alpha の版しかない・利用規約・レコードフォーム系が含まれない）。各部品の `@api` の全部は持たない。

`lwcElement` の `metadataRefs`（kind なし）は、カタログでメタデータを参照するとした属性: `{ attribute, refType, value?, expression?, objectExpression? }`。

| タグ                                                                                 | 属性                                  | `refType`                          |
| ------------------------------------------------------------------------------------ | ------------------------------------- | ---------------------------------- |
| `lightning-record-form` / `lightning-record-edit-form` / `lightning-record-view-form` | `object-api-name` / `fields` / `record-type-id` | `object` / `field` / `recordType`  |
| `lightning-input-field` / `lightning-output-field`                                   | `field-name`                          | `field`（祖先のフォームのオブジェクトと合わせて `Account.Name`） |
| `lightning-record-picker`                                                            | `object-api-name`                     | `object`                           |
| `lightning-list-view`                                                                | `object-api-name` / `list-view-api-name` | `object` / `listView`           |
| `lightning-flow`                                                                     | `flow-api-name`                       | `flow`                             |
| どの `lightning-*` でも                                                              | `icon-name` / `fallback-icon-name` / `prefix-icon-name` | `icon`             |

- 値が式のときは `expression`（解析で JS の `@salesforce/schema` の import から解決する）。項目で、祖先のフォームの `object-api-name` が式のときは、項目名と `objectExpression` を持つ。
