# LWC のライブラリの parse 結果と属性

LWC のバンドルの各ファイルを、[lwc-implementation.md](./lwc-implementation.md) のライブラリでそのまま parse し、返ってくる形（ノードの種類と属性）をまとめたもの。IR / JSON（`types/lwc`）に変換する前の、元になる情報の一覧として使う。

- サンプル: [docs/examples/lwc/samples/bundles/](./examples/lwc/samples/bundles/force-app/main/default/lwc/)（JS は TS で書いた）
- 実行: `npx ttsx --noCheck docs/examples/lwc/scripts/run-library-parse.ts`（`--raw` でライブラリの木をそのまま出す）
- 出力: [docs/examples/lwc/library-output/](./examples/lwc/library-output/)`<バンドル>/<ファイル>.<ライブラリ>.json`
- 全属性の一覧（自動生成）: [library-output/attributes.md](./examples/lwc/library-output/attributes.md)。サンプルに出てきたノードの種類ごとに、キー・値の型・件数・例を並べている。この文書は、その中から解析に使うものを選んで説明する

## 1. サンプル

| バンドル      | ファイル                                  | 確かめること                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accountList` | `.ts` / `.html` / `.css` / `.js-meta.xml` | 主な構文をひととおり。TS: `@api` / `@track` / `@wire`（Apex・`getRecord`）、getter、`async`、`CustomEvent<T>`、`interface` / `type`、`NavigationMixin`、`@salesforce/schema` / `label` の import、`import type`、`!` / `?` / `private`。HTML: `lwc:if` / `lwc:elseif` / `lwc:else`、`for:each`、`iterator:`、`key`、`lwc:ref`、`lwc:dom`、子コンポーネントへのプロパティとイベント、`slot`。CSS: `:host`、カスタムプロパティ、`var()`、`!important`、`@media`。XML: `targets`、`targetConfigs`（`property` / `objects` / `supportedFormFactors`） |
| `accountRow`  | 4 種類                                    | `accountList` の子コンポーネント（`@api` と `select` イベント）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `utils`       | `.ts` / `.js-meta.xml`                    | 共有のモジュール（テンプレートなし。`export type` / `export interface` / `export const` / `export function`）                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `broken`      | 4 種類                                    | LWC の仕様違反: `@api` と `@track` の併用（LWC1093）、`if:true` と `lwc:if` の併用（LWC1166）、大文字のイベント名（LWC1055）、`:root`（style-compiler のエラー）                                                                                                                                                                                                                                                                                                                                                                                  |

実行の結果（[run-library-parse.ts](./examples/lwc/scripts/run-library-parse.ts) の出力）:

| ファイル        | 結果                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `*.ts`          | Babel の構文エラーは 0 件。型を空白にした JS は、`broken.ts` 以外 `@lwc/compiler` を通る（空白にできない構文も 0 件） |
| `*.html`        | `broken.html` だけ template-compiler の診断 2 件（LWC1166 / LWC1055）                                                 |
| `*.css`         | `broken.css` だけ style-compiler がエラー（例外）                                                                     |
| `*.js-meta.xml` | すべて読める                                                                                                          |

## 2. 位置の表し方（ライブラリごとに違う）

| ライブラリ             | 場所                                                                             | 行       | 列           | 文字位置           | 終わり                                          |
| ---------------------- | -------------------------------------------------------------------------------- | -------- | ------------ | ------------------ | ----------------------------------------------- |
| @babel/parser          | ノードの `start` / `end`、`loc.start` / `loc.end`（`line` / `column` / `index`） | 1 始まり | 0 始まり     | 0 始まり（UTF-16） | 次の文字                                        |
| parse5                 | `sourceCodeLocation`（`startLine` / `startCol` / `startOffset` / `end*`）        | 1 始まり | **1 始まり** | 0 始まり           | 次の文字                                        |
| @lwc/template-compiler | `location`（`startLine` / `startColumn` / `start` / `end*`）                     | 1 始まり | **1 始まり** | 0 始まり           | 次の文字                                        |
| postcss                | `source.start` / `source.end`（`line` / `column` / `offset`）                    | 1 始まり | **1 始まり** | 0 始まり           | **最後の文字**（`end.offset` は最後の文字の次） |
| parseXml（自前）       | `start` / `end`（`offset` / `line` / `column`）                                  | 1 始まり | 0 始まり     | 0 始まり           | 次の文字                                        |

- Apex の `SourcePosition`（行は 1 始まり、列は 0 始まり）と同じなのは Babel と parseXml。parse5・template-compiler・postcss は列を 1 引いてそろえる。
- postcss の `end.column` は最後の文字の位置（`    display: block;` の `decl` は `start.column: 5`、`end.column: 19`（`;` の列）、`end.offset` は `;` の次）。`end.offset` だけが次の文字の位置。
- template-compiler の式の中のノード（`Identifier` / `MemberExpression`）の `start` / `end` は、**`{…}` の中での位置**（`{title}` の `title` は `start: 1`）。ファイルの中の位置は、ノードによって `location` があるときだけ分かる（属性の値・テキストのトップの式には付く。`row.id` の `row` には付かない）。
- template-compiler の `location` は、同じオブジェクトが親子で共有される（`Property` と、その値の式など）。JSON にするときに循環とみなさないよう、祖先だけを見る（run-library-parse.ts の `toJson`）。

## 3. JS / TS（@babel/parser）

設定は [eraseTypes.ts](./examples/lwc/eraseTypes.ts) の `BABEL_TS_OPTIONS`（`typescript` と `decorators` のプラグイン、`tokens: true`、`createParenthesizedExpressions: true`）に、`errorRecovery: true` と `attachComment: false` を足したもの。JS のときは `typescript` を外す。

### 3.1 すべてのノードに共通

| キー                    | 内容                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                  | ノードの種類（ESTree に近い Babel AST。`ClassProperty` / `ClassMethod` など、ESTree の `PropertyDefinition` / `MethodDefinition` と名前が違うものがある） |
| `start` / `end` / `loc` | 位置（2 章）。`loc.identifierName` は `Identifier` の名前（`loc` を持つノードすべてにキーがあるが、値は `Identifier` だけ）                               |
| `extra`                 | 元の書き方。`raw`（`'lwc'`）/ `rawValue`、`parenthesized`、`trailingComma`（最後のカンマの位置）、`topLevelAwait`（Program）                              |

ファイルの全体は `File`（`errors`: `errorRecovery` で回復した構文エラー、`program`、`comments`: 今回は使わない）→ `Program`（`sourceType`、`body`、`directives`）。トークン（`tokens`）は `type.label`（`,` / `name` / `@` など）と位置を持つ。`?` / `!` / `private` など、ノードの位置からは分からない記号・修飾子の位置を取るのに使う（lwc-parse-plan.md 3.2）。

### 3.2 LWC の解析に使うノード

| ノード                                                                    | 主な属性                                                                                                                                                                                                                   | 解析で取るもの                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ImportDeclaration`                                                       | `source.value`（`'lwc'` / `'@salesforce/apex/AccountController.getAccounts'` など）、`specifiers`、`importKind`（`value` / `type`。`import type` は `type`）                                                               | 依存先（Apex のメソッド・項目・ラベル・ほかのコンポーネント）。`@salesforce/*` の分類                                                                                                                 |
| `ImportDefaultSpecifier` / `ImportSpecifier` / `ImportNamespaceSpecifier` | `local.name`、`imported.name`（名前付き）、`importKind`（`import { type X }`）                                                                                                                                             | import した名前と元の名前の対応（デコレーター・`@wire` のアダプターを名前で引く）                                                                                                                     |
| `ExportDefaultDeclaration` / `ExportNamedDeclaration`                     | `declaration`、`specifiers`、`exportKind`（`value` / `type`）                                                                                                                                                              | メインのクラス（default）、共有のモジュールの公開する名前                                                                                                                                             |
| `ClassDeclaration`                                                        | `id.name`、`superClass`（`Identifier` の `LightningElement`、または `CallExpression` の `NavigationMixin(LightningElement)`）、`body.body`、TS は `implements` / `typeParameters` / `abstract`                             | コンポーネントのクラス・継承・Mixin                                                                                                                                                                   |
| `ClassProperty`                                                           | `key`（`Identifier`。`computed` なら式）、`value`（初期値。ないと `null`）、`decorators`、`static`、TS は `typeAnnotation`、`optional`（`?`）、`definite`（`!`）、`accessibility`（`private` など）、`readonly`、`declare` | プロパティ（`@api` / `@track` / `@wire` / なし）、初期値、型                                                                                                                                          |
| `ClassMethod`                                                             | `key`、`kind`（`method` / `get` / `set` / `constructor`）、`params`、`body`、`async`、`generator`、`static`、`decorators`、TS は `returnType`・`accessibility`                                                             | メソッド・getter / setter、`@api` のメソッド、イベントのハンドラーの候補                                                                                                                              |
| `ClassPrivateProperty` / `ClassPrivateMethod`                             | `key` が `PrivateName`（`#x`）                                                                                                                                                                                             | 外から見えないメンバー                                                                                                                                                                                |
| `Decorator`                                                               | `expression`（`@api` は `Identifier`、`@wire(getRecord, {…})` は `CallExpression`）                                                                                                                                        | デコレーターの種類と、`@wire` のアダプター（`arguments[0]`）・設定（`arguments[1]` の `ObjectExpression`。`'$recordId'` は反応する値）                                                                |
| `CallExpression` / `NewExpression`                                        | `callee`、`arguments`、`optional`。`OptionalCallExpression`（`a?.()`）                                                                                                                                                     | `this.dispatchEvent(new CustomEvent('accountselect', {…}))`（発火するイベントの名前・`bubbles` / `composed`）、Apex の命令的な呼び出し（`deleteAccount({…})`）、`this[NavigationMixin.Navigate]({…})` |
| `MemberExpression` / `OptionalMemberExpression`                           | `object`、`property`、`computed`、`optional`                                                                                                                                                                               | `this.xxx` の参照（テンプレートとの突き合わせ）、`this.refs.table`                                                                                                                                    |

式・文のノード（`BlockStatement` / `IfStatement` / `TryStatement` / `ReturnStatement` / `ArrowFunctionExpression` / `ObjectExpression` / `ObjectPattern` / `AwaitExpression` / `LogicalExpression` / `BinaryExpression` / `StringLiteral` / `NumericLiteral` / `BooleanLiteral` など）は ESTree とほぼ同じ形。サンプルに出てきたものの属性は attributes.md にある。

### 3.3 TS の型のノード

| ノード                                                                                                                        | 主な属性                                                                                          | 例                                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `TSTypeAnnotation`                                                                                                            | `typeAnnotation`（型の本体）                                                                      | `: string` の `: ` から型の終わりまで（空白にする範囲） |
| `TSStringKeyword` / `TSNumberKeyword` / `TSBooleanKeyword` / `TSVoidKeyword` / `TSUnknownKeyword` / `TSUndefinedKeyword` など | （位置だけ）                                                                                      | `string` / `number` / …                                 |
| `TSTypeReference`                                                                                                             | `typeName`（`Identifier` / `TSQualifiedName`）、`typeArguments`（`TSTypeParameterInstantiation`） | `Row`、`CustomEvent<SelectDetail>`、`Promise<void>`     |
| `TSArrayType`                                                                                                                 | `elementType`                                                                                     | `Row[]`                                                 |
| `TSUnionType`                                                                                                                 | `types`                                                                                           | `'table' \| 'tile'`、`string \| undefined`              |
| `TSLiteralType`                                                                                                               | `literal`（`StringLiteral` など）                                                                 | `'asc'`                                                 |
| `TSTypeLiteral`                                                                                                               | `members`（`TSPropertySignature` など）                                                           | `{ data?: unknown; error?: unknown }`                   |
| `TSPropertySignature`                                                                                                         | `key`、`typeAnnotation`、`optional`、`computed`                                                   | `recordId: string;`                                     |
| `TSInterfaceDeclaration`                                                                                                      | `id`、`body.body`、`extends`、`typeParameters`                                                    | `interface SelectDetail {…}`                            |
| `TSTypeAliasDeclaration`                                                                                                      | `id`、`typeAnnotation`、`typeParameters`                                                          | `type ViewMode = …`                                     |
| `TSAsExpression` / `TSNonNullExpression` / `TSSatisfiesExpression`                                                            | `expression`、`typeAnnotation`                                                                    | `x as string`、`dataset.id!`                            |
| `TSTypeParameterInstantiation`                                                                                                | `params`                                                                                          | `new CustomEvent<SelectDetail>(…)` の `<SelectDetail>`  |

- 型の参照（`TSTypeReference`）の名前は、`import type` / `interface` / `type` の宣言と名前で突き合わせて解決する（未実装。[lwc-implementation.md](./lwc-implementation.md) 7 章）。
- Babel 8 では、型の引数は `typeArguments`（Babel 7 の `typeParameters` から名前が変わった）。宣言の型の引数（`<T>`）は `typeParameters`（`TSTypeParameterDeclaration`）のまま。

### 3.4 LWC の検証（@lwc/compiler の `transformSync`）

- `.ts` は型を空白にした JS（`eraseTypes`）を渡す。成功すると `{ code, warnings }`（`code` は変換後の JS。`registerDecorators` / テンプレートの import が入る）。サンプルの `warnings` はすべて空。
- 仕様違反は**例外**になる。例外の `code`（`1093`）、`filename`、`location`（`line` / `column` / `start` / `length`）、`message`（`LWC1093: @api method or property cannot be used with @track` に、色付きのコードの抜粋が続く）。`location` は型を空白にした JS の位置で、空白にしても位置は変わらないので、元の TS の位置と同じ（verify-erase-types.ts で確認済み）。
- 1 回の変換で報告されるのは最初の 1 件だけ。

## 4. HTML

### 4.1 parse5（`parseFragment(source, { sourceCodeLocationInfo: true })`）

HTML の木をそのまま返す（LWC の構文は知らない）。

| ノード                      | 主な属性                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#document-fragment`        | `childNodes`（ルート、および `template` の `content`）                                                                                                 |
| 要素（`nodeName` がタグ名） | `tagName`、`attrs`（`{ name, value }` の配列。値は書いたままの文字列で、`{title}` も `"{title}"`）、`namespaceURI`、`childNodes`、`sourceCodeLocation` |
| `template`                  | 要素の属性に加えて `content`（`#document-fragment`。子は `childNodes` ではなくここに入る）                                                             |
| `#text`                     | `value`（空白・改行だけのテキストも 1 つのノード）                                                                                                     |
| `#comment`                  | `data`（今回は対象外）                                                                                                                                 |

`sourceCodeLocation` は、要素の全体の位置に加えて `startTag` / `endTag`（終了タグがないと `endTag` もない）と、**属性ごとの位置** `attrs`（`startTag.attrs` も同じ）を持つ。

- 属性の名前は小文字になる（`onClick` → `onclick`）。大文字・小文字の違反（LWC1055）は parse5 では分からないので、template-compiler の診断を使う。
- `{…}` の式は解釈しない。構文エラー（閉じていないタグなど）は `parseFragment` の `onParseError` で受け取る（例外にはならない）。

### 4.2 @lwc/template-compiler（`parse(source, { name, namespace })`）

LWC のテンプレートとして解釈した木（IR）と、診断（`warnings`）を返す。parse5 との違いは、ディレクティブ・式・イベントが分かれていること。

| ノード                                        | 主な属性                                                                                       | 元の HTML                                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`                                        | `children`、`directives`（ルートの `lwc:render-mode` / `lwc:preserve-comments`）、`location`   | `<template>`                                                                                                                                                      |
| `Element`                                     | `name`、`namespace`、`attributes`、`properties`、`directives`、`listeners`、`children`         | `<p>` / `<table>` などの標準の要素                                                                                                                                |
| `Component`                                   | `Element` と同じ                                                                               | `-` を含むタグ（`<c-account-row>`、`<lightning-card>`）                                                                                                           |
| `Slot`                                        | `Element` と同じ + `slotName`                                                                  | `<slot name="footer">`                                                                                                                                            |
| `Text`                                        | `raw`（`{parentName}`）、`value`（`Literal` または式）                                         | テキスト。`{…}` を含むテキストは、式ごとに分かれる                                                                                                                |
| `IfBlock` / `ElseifBlock` / `ElseBlock`       | `condition`（式）、`children`、`else`（次の `ElseifBlock` / `ElseBlock`）、`directiveLocation` | `lwc:if` / `lwc:elseif` / `lwc:else`。**要素ではなくブロックとして木に入る**（`<template lwc:if>` はブロックだけになり、`<span lwc:if>` はブロックの子に `span`） |
| `ForEach`                                     | `expression`、`item`、`index`（`Identifier`）                                                  | `for:each` / `for:item` / `for:index`                                                                                                                             |
| `ForOf`                                       | `expression`、`iterator`                                                                       | `iterator:it`                                                                                                                                                     |
| `Attribute`                                   | `name`、`value`（`Literal` / 式）                                                              | HTML の属性のまま残るもの（`class` / `slot` / `data-*` / `<slot>` の `name`）                                                                                     |
| `Property`                                    | `name`（camelCase: `recordId`）、`attributeName`（`record-id`）、`value`                       | 要素・コンポーネントの**プロパティ**として渡すもの（`title={title}`、`label="更新"`、`icon-name="standard:account"`）                                             |
| `EventListener`                               | `name`（`on` を除いた名前: `click` / `select`）、`handler`（式）                               | `onclick={refresh}`                                                                                                                                               |
| `Directive`                                   | `name`（`Key` / `Ref` / `Dom` / `Dynamic` / `Spread` / `External` など）、`value`              | `key={row.id}`、`lwc:ref="table"`、`lwc:dom="manual"`                                                                                                             |
| `Identifier` / `MemberExpression` / `Literal` | ESTree の式（`object` / `property` / `computed` / `optional`）。位置は 2 章                    | `{row.id}`                                                                                                                                                        |

- **Error の診断が出た要素は、木から落ちる**（`broken.html` の `<div if:true lwc:if>` は、中身が空の `IfBlock` だけになる）。仕様違反のあるテンプレートの IR は、参照の突き合わせに使わない（構文エラーと同じく `resolvedError` だけにする）。

診断（`warnings`）は `code`（`1166`）、`message`（`LWC1166: …`）、`level`（`@lwc/errors` の `DiagnosticLevel`。`0` Fatal / `1` Error / `2` Warning / `3` Log。サンプルの 2 件は `1`）、`location`（`line` / `column` / `start` / `length`）、`url`。**Error でも例外にはならず、`warnings` に入る**（`root` も返る）。

- テンプレートの参照（`Property` / `Text` / `IfBlock` の `condition`、`EventListener` の `handler` の式の先頭の名前）を JS のクラスのメンバーと突き合わせると、存在しないプロパティ・ハンドラーを見つけられる（lwc-parse-plan.md の bundle.ts）。`ForEach` の `item` / `index`、`ForOf` の `iterator` はその中だけの名前なので除く。
- 子コンポーネントの `Property` の `name` は、子の JS の `@api` と突き合わせる（`c-account-row` の `recordId` / `name` / `amount`）。`EventListener` の `name` は、子が `dispatchEvent` する名前（`select`）と突き合わせる。

## 5. CSS

### 5.1 postcss（`postcss.parse(source).toJSON()`）

| ノード    | 主な属性                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`    | `nodes`、`source`、`inputs`（`css`: 元の CSS、`file`、`hasBOM`）、`raws`                                                                                                        |
| `rule`    | `selector`（`.parent,\n.total` のように書いたままの文字列）、`nodes`                                                                                                            |
| `atrule`  | `name`（`media`）、`params`（`(max-width: 480px)`）、`nodes`（`@import` などはなし）                                                                                            |
| `decl`    | `prop`（`display`、カスタムプロパティは `--account-list-gap`）、`value`（`var(--lwc-colorTextDefault, #181818)` も文字列のまま）、`important`（`!important` のときだけ `true`） |
| `comment` | `text`（今回は対象外）                                                                                                                                                          |

- すべてのノードに `source`（2 章）と `raws`（`before` / `between` / `after` / `semicolon` / `afterName` など、空白と区切りの書き方）がある。`raws` は内容の比較には使わない（Apex の空白と同じ扱い）。
- セレクター・値の中は解釈しない（`var()` の参照、`:host` の判定は文字列から行う。必要なら `postcss-selector-parser` / `postcss-value-parser` を足す）。

### 5.2 @lwc/style-compiler（`transform(source, filename, {})`）

- 成功すると `{ code }`（スコープ付きの CSS を返す JS の関数）。
- 仕様違反は**例外**（`broken.css` の `:root`）。例外の `line` / `column`（1 始まり）・`reason`（位置を含まないメッセージ）・`message`（ファイル名と位置付き）。`code` はない（LWC の番号が付かない）。

## 6. js-meta.xml（parseXml）

自前の [types/commons/xml.ts](../src/analyzer/types/commons/xml.ts)。すべての要素が同じ形の `XmlElement`。

| キー            | 内容                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`          | 要素名（`LightningComponentBundle` / `targetConfig` / `property` …）                                                |
| `attributes`    | 属性（`{ targets: 'lightning__RecordPage' }`、`property` の `name` / `type` / `label` / `default` / `min` / `max`） |
| `children`      | 子の要素                                                                                                            |
| `text`          | 直下のテキスト（前後の空白を除く。`61.0` / `true` / `lightning__RecordPage`）                                       |
| `start` / `end` | 位置（2 章）                                                                                                        |

サンプルに出てきた要素:

| 要素                                                                           | 中身                                                                                                 |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `apiVersion` / `isExposed` / `masterLabel` / `description`                     | テキスト                                                                                             |
| `targets` → `target`                                                           | 置ける場所（`lightning__RecordPage` / `lightning__AppPage` …）                                       |
| `targetConfigs` → `targetConfig`（属性 `targets`）                             | 置き場所ごとの設定                                                                                   |
| `targetConfig` → `property`（属性のみ）                                        | App Builder で設定できる値。`name` は JS の `@api` のプロパティと突き合わせる（`title` / `maxRows`） |
| `targetConfig` → `objects` → `object`                                          | 置けるオブジェクト（`Account`）                                                                      |
| `targetConfig` → `supportedFormFactors` → `supportedFormFactor`（属性 `type`） | `Large` / `Small`                                                                                    |

## 7. 解析の単位で見たときの対応

バンドルの中で、ファイルをまたいで突き合わせるもの:

| JS / TS（Babel）                                   | HTML（template-compiler）                                    | js-meta.xml          | CSS                        |
| -------------------------------------------------- | ------------------------------------------------------------ | -------------------- | -------------------------- |
| `@api` の `ClassProperty` / `ClassMethod` の `key` | 親のテンプレートの `Component` の `Property.name`            | `property` の `name` |                            |
| `ClassProperty` / getter の `key`                  | `Property` / `Text` / `IfBlock` / `ForEach` の式の先頭の名前 |                      |                            |
| `ClassMethod` の `key`                             | `EventListener.handler`                                      |                      |                            |
| `dispatchEvent(new CustomEvent('<名前>'))` の名前  | 親のテンプレートの `EventListener.name`                      |                      |                            |
| `this.refs.<名前>`                                 | `Directive`（`Ref`）の `value`                               |                      |                            |
|                                                    | `Attribute`（`class`）の値                                   |                      | `rule.selector` のクラス名 |
