# LWC の JS / TS の JSON の型の見直し

LWC の JS / TS の JSON（[types/lwc/](../src/analyzer/types/lwc/)）は、Apex の JSON（[types/apex/](../src/analyzer/types/apex/)）より粗い。メソッドの本体は「文の数」と「決まった形の呼び出しの一覧」だけで、引数・初期値はソースの文字列のまま持つ。この文書は次の 5 つをまとめる。

1. 今の LWC の JSON の型（2 章）
2. 使われ方（3 章）
3. 足りていないもの（4 章）
4. 型にするべきタイプの案（5 章）
5. 進め方の案（6 章）

- 流れ: Babel → IR（[lwc_IR](../src/analyzer/types/lwc_IR/)。一覧は [lwc-ir-types.md](./lwc-ir-types.md)）→ JSON（types/lwc）→ Diff（[processor/Lwc/diff/](../src/analyzer/processor/Lwc/diff/)）・解析・依存関係。
- 比べる相手: Apex の JSON（[apex-implementation.md](./apex-implementation.md)、[apex-json-analysis.md](./apex-json-analysis.md)）。
- 調べた範囲はコードを読んだもの。実行して確かめていないものは **未確認** と書く。
- この文書は調査と案だけ。ソースは変えていない。

## 1. 用語（境界ノード）

Apex の JSON に合わせて、ノードを 3 つに分けて書く。

| 呼び方     | 形                                                                | Apex の例                                                                                                                                                                             | Diff・解析での扱い                                                           |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 境界ノード | `kind` と `sourceKeys` を持つ（`JsonType` / `StructureJsonType`） | 文（`if` / `expression` など）、`memberAccess`、宣言、`type` の最上位                                                                                                                 | Diff の単位（`NodeDiff`）。位置を引ける                                      |
| 位置だけ   | `sourceKeys` を持ち、`kind` を持たない                            | 式（`FormulaJson` などの `ExpressionValueKeys`。[expression.ts](../src/analyzer/types/apex/expression.ts#L228)）、リテラル（[primary.ts](../src/analyzer/types/apex/primary.ts#L12)） | Diff の単位ではない（GumTree は形からラベルを決める）。findings の位置に使う |
| キーなし   | どちらも持たない                                                  | 型引数・要素型（`TypeContentJson`）、`if` の `conditionBlock` の入れ物                                                                                                                | 親の値の一部                                                                 |

- 名前を持つ宣言は `StructureJsonType`（`sourceKeys: { base, name }`）。
- LWC の `LwcModuleJson` は Apex の unit と同じく境界ノードにしない（[module.ts](../src/analyzer/types/lwc/module.ts#L1-L3)）。

## 2. 今の LWC の JSON の型

### 2.1 一覧

`Lwc*Json` のうち、JS / TS のもの（テンプレート・CSS・js-meta.xml は除く）。

| 型                                                                           | kind                 | 区分              | もとの IR のノード                                                                                     |
| ---------------------------------------------------------------------------- | -------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| [`LwcModuleJson`](../src/analyzer/types/lwc/module.ts#L49)                   | なし                 | 入れ物            | `file` → `program.body`                                                                                |
| [`LwcImportJson`](../src/analyzer/types/lwc/import.ts#L33)                   | `lwcImport`          | 境界              | `importDeclaration`                                                                                    |
| [`LwcImportSpecifierJson`](../src/analyzer/types/lwc/import.ts#L23)          | `lwcImportSpecifier` | 境界              | `importSpecifier` / `importDefaultSpecifier` / `importNamespaceSpecifier`                              |
| [`LwcDeclarationJson`](../src/analyzer/types/lwc/module.ts#L32)              | `lwcDeclaration`     | 境界（Structure） | 直下の `variableDeclarator` / `functionDeclaration` / `classDeclaration`（コンポーネント以外）         |
| [`LwcTypeDeclarationJson`](../src/analyzer/types/lwc/typeDeclaration.ts#L23) | `lwcTypeDeclaration` | 境界（Structure） | `tSInterfaceDeclaration` / `tSTypeAliasDeclaration` / `tSEnumDeclaration`                              |
| [`LwcTypeMemberJson`](../src/analyzer/types/lwc/typeDeclaration.ts#L15)      | なし                 | キーなし          | `tSPropertySignature` / `tSMethodSignature`                                                            |
| [`LwcTypeJson`](../src/analyzer/types/lwc/type.ts#L35)                       | `lwcType`            | 境界              | 型注釈（`tSTypeAnnotation` など）の最上位の型                                                          |
| [`LwcTypeContentJson`](../src/analyzer/types/lwc/type.ts#L17)                | なし                 | キーなし          | 型引数・要素型                                                                                         |
| [`LwcComponentJson`](../src/analyzer/types/lwc/component.ts#L174)            | `lwcComponent`       | 境界（Structure） | default export の `classDeclaration` / `classExpression`                                               |
| [`LwcFieldJson`](../src/analyzer/types/lwc/component.ts#L129)                | `lwcField`           | 境界（Structure） | `classProperty` / `classPrivateProperty` / `classAccessorProperty`                                     |
| [`LwcPropertyJson`](../src/analyzer/types/lwc/component.ts#L146)             | `lwcProperty`        | 境界（Structure） | `classMethod`（`get` / `set`）。同じ名前の getter と setter を 1 つにする                              |
| [`LwcAccessorContentJson`](../src/analyzer/types/lwc/component.ts#L141)      | なし                 | キーなし          | getter / setter の中身                                                                                 |
| [`LwcMethodJson`](../src/analyzer/types/lwc/component.ts#L156)               | `lwcMethod`          | 境界（Structure） | `classMethod` / `classPrivateMethod`                                                                   |
| [`LwcConstructorJson`](../src/analyzer/types/lwc/component.ts#L165)          | `lwcConstructor`     | 境界（Structure） | `classMethod`（`constructor`）                                                                         |
| [`LwcParameterJson`](../src/analyzer/types/lwc/component.ts#L120)            | `lwcParameter`       | 境界              | 関数の引数・`tSParameterProperty`                                                                      |
| [`LwcModifiersJson`](../src/analyzer/types/lwc/component.ts#L69)             | なし                 | キーなし          | TS の修飾子・`decorator` の配列                                                                        |
| [`LwcDecoratorJson`](../src/analyzer/types/lwc/component.ts#L51)             | `lwcDecorator`       | 境界              | `decorator`                                                                                            |
| [`LwcWireConfigJson`](../src/analyzer/types/lwc/component.ts#L40)            | `lwcWireConfig`      | 境界              | `@wire` の第 2 引数の `objectProperty`                                                                 |
| [`LwcBodyContentJson`](../src/analyzer/types/lwc/component.ts#L112)          | なし                 | キーなし          | 本体の部分木（`walkNodes` でたどる）                                                                   |
| [`LwcBodyJson`](../src/analyzer/types/lwc/component.ts#L95)                  | `lwcBody`            | 境界              | 本体の `blockStatement`                                                                                |
| [`LwcCallJson`](../src/analyzer/types/lwc/component.ts#L75)                  | `lwcCall`            | 境界              | 決まった形の `callExpression` / `optionalCallExpression` / `memberExpression` / `assignmentExpression` |
| [`LwcEventJson`](../src/analyzer/types/lwc/component.ts#L100)                | `lwcEvent`           | 境界              | `newExpression`（`new CustomEvent`）                                                                   |
| [`LwcImportReferenceJson`](../src/analyzer/types/lwc/component.ts#L30)       | なし                 | キーなし          | 式の中の `identifier` のうち、import の名前のもの                                                      |

### 2.2 本体の型（いちばん粗いところ）

メソッド・getter / setter・コンストラクタ・直下の関数は、本体を次の形で持つ。

```ts
// component.ts
export type LwcBodyJson = JsonType<'lwcBody'> & {
    /** 本体の直下の文の数 */
    statements: number;
};
export type LwcBodyContentJson = {
    body?: LwcBodyJson;
    calls: LwcCallJson[];
    events: LwcEventJson[];
};
```

- 文の中身は JSON にない。中身はソース位置（`sourceObject`）だけが持つ。本体が変わると `lwcBody` の `objectKey` が変わるので、「どこかが変わった」ことだけが分かる（[component.ts](../src/analyzer/types/lwc/component.ts#L560-L572)）。
- `calls` / `events` は本体の部分木を `walkNodes` でたどり、決まった形だけを拾う（[makeLwcBodyContentJson](../src/analyzer/types/lwc/component.ts#L426-L573)）。入れ子の関数（`then` のコールバックなど）の中も拾い、外側のメソッドのものにする。

`LwcCallJson` の `callType` と拾う形:

| callType        | 拾う形                                                             | `target`                                             | `arg`                      |
| --------------- | ------------------------------------------------------------------ | ---------------------------------------------------- | -------------------------- |
| `apex`          | callee が識別子で、`@salesforce/apex/...` の default import のもの | import の名前                                        | 引数のソースの文字列       |
| `navigate`      | `this[NavigationMixin.<名前>](...)`                                | `Navigate` / `GenerateUrl`                           | 同上（ページ参照は文字列） |
| `querySelector` | `this.template.querySelector(All)(...)`                            | セレクターの式の文字列（`'div'` のように引用符ごと） | 同上                       |
| `refs`          | `this.refs.<名前>`（同じ名前は 1 つ）                              | 名前                                                 | なし                       |
| `dispatchEvent` | `this.dispatchEvent(...)`                                          | `new X(...)` なら `X`、ほかは式の文字列              | 同上                       |
| `innerHTML`     | `x.innerHTML = ...` / `x.outerHTML = ...`                          | 代入先の式の文字列                                   | なし                       |

### 2.3 文字列のまま持つもの・落とすもの

| 型・プロパティ                                                 | 持ち方                                                                                            | 根拠                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `LwcCallJson.arg`                                              | 引数ごとのソースの文字列                                                                          | [component.ts](../src/analyzer/types/lwc/component.ts#L442)                                                        |
| `LwcDecoratorJson.arg`、`wire.adapter`                         | ソースの文字列                                                                                    | [component.ts](../src/analyzer/types/lwc/component.ts#L282-L315)                                                   |
| `LwcWireConfigJson.value`                                      | 値のソースの文字列。`reactive` は値が `'$...'` の文字列リテラルのときだけ                         | [component.ts](../src/analyzer/types/lwc/component.ts#L288-L300)                                                   |
| `LwcEventJson.detail`、`name`                                  | 文字列（名前がリテラルでなければ式の文字列）                                                      | [component.ts](../src/analyzer/types/lwc/component.ts#L521-L555)                                                   |
| `LwcFieldJson.init`、`LwcDeclarationJson.init`                 | 初期値のソースの文字列。関数を初期値にした変数は、関数全体の文字列も `init` に入る                | [component.ts](../src/analyzer/types/lwc/component.ts#L650)、[module.ts](../src/analyzer/types/lwc/module.ts#L176) |
| `LwcParameterJson.variant`                                     | 名前。分割代入はパターンの文字列（`'{ data, error }'`）。既定値は落とし `optional: true` だけ残す | [component.ts](../src/analyzer/types/lwc/component.ts#L383-L411)                                                   |
| `LwcComponentJson.extend` / `mixins`                           | 式の文字列                                                                                        | [component.ts](../src/analyzer/types/lwc/component.ts#L771-L789)                                                   |
| `LwcModuleJson.otherExports`                                   | export した名前の文字列だけ（再エクスポートの import 元を持たない）                               | [module.ts](../src/analyzer/types/lwc/module.ts#L274-L283)                                                         |
| 文・ローカル変数・制御構造・`this` のメンバーの読み書き        | 持たない                                                                                          | `LwcBodyJson` が文の数だけ                                                                                         |
| `static` ブロック・TS のオーバーロード・インデックスシグネチャ | 落とす                                                                                            | [component.ts](../src/analyzer/types/lwc/component.ts#L760)                                                        |
| コンポーネント以外のクラスのメンバー                           | 落とす（`declarationType: 'class'`、`calls: []`、`events: []` だけ）                              | [module.ts](../src/analyzer/types/lwc/module.ts#L196-L208)                                                         |
| `export default function` / 式（クラス以外）                   | 落とす                                                                                            | [module.ts](../src/analyzer/types/lwc/module.ts#L243-L257)                                                         |
| `export * from '...'`、直下の式の文（`registerX(...)` など）   | 落とす（`switch` の default は型の宣言だけを見る）                                                | [module.ts](../src/analyzer/types/lwc/module.ts#L286-L289)                                                         |

## 3. 使われ方

### 3.1 使う側の一覧

| 使う側                                                                                     | 使う型・プロパティ                                                                                                                                                                                                          | 何をしているか                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diff [diff/component.ts](../src/analyzer/processor/Lwc/diff/component.ts)                  | コンポーネント・メンバー・修飾子・デコレーター・wire・`lwcCall`・`lwcEvent`・`lwcBody`・引数                                                                                                                                | kind ごとの `NodeDiff`。`calls` / `events` は C. 順序付き列、`lwcBody` は `statements` の値だけを比べる（[L226-L253](../src/analyzer/processor/Lwc/diff/component.ts#L226-L253)） |
| Diff [diff/module.ts](../src/analyzer/processor/Lwc/diff/module.ts)                        | import・`lwcDeclaration`・`lwcTypeDeclaration`・`otherExports`                                                                                                                                                              | 宣言は名前で D. キー対応（[L128-L168](../src/analyzer/processor/Lwc/diff/module.ts#L128-L168)）                                                                                   |
| Diff [diff/bundle.ts](../src/analyzer/processor/Lwc/diff/bundle.ts)                        | `LwcModuleJson`                                                                                                                                                                                                             | ファイル名で対応付けて `makeLwcModuleDiff` を呼ぶ                                                                                                                                 |
| 検証 [validate/bundle.ts](../src/analyzer/parser/Lwc/validate/bundle.ts)                   | `LwcComponentJson.block` のメンバー名・`extend`・`mixins`、`lwcCall` の `refs`                                                                                                                                              | テンプレートの式・ハンドラーがメンバーにあるか、`this.refs.x` が `lwc:ref` にあるか（[L101-L127](../src/analyzer/parser/Lwc/validate/bundle.ts#L101-L127)）                       |
| 解析 [analysis.ts](../src/analyzer/processor/Lwc/analysis.ts)                              | `@api` のメンバー、メソッド・getter / setter の `events`、`lwcField.references`、`lwcImport.schema`                                                                                                                         | 子の `@api`・イベントとの突き合わせ、テンプレートの式（`{fields}`）を schema の import から解決（[L144-L205](../src/analyzer/processor/Lwc/analysis.ts#L144-L205)）               |
| 依存関係 [units.ts](../src/analyzer/processor/dependency/units.ts)（`getLwcDependencies`） | `lwcImport.source`、`lwcElement`（テンプレート）、`lwcComponent.block` の `@api`                                                                                                                                            | import 元の文字列から参照を作る（[L222-L271](../src/analyzer/processor/dependency/units.ts#L222-L271)）。本体の `lwcCall` は見ない                                                |
| レポート [report/](../src/analyzer/report/)                                                | なし（JS の JSON は使わない）                                                                                                                                                                                               | LWC は `lwc.placements`（js-meta.xml と画面）だけ。`analyzeLwcBundles` を呼ぶところも src にない（grep）                                                                          |
| テスト                                                                                     | [lwc-json.test.ts](../test/converter/lwc-json.test.ts)、[lwc-diff.test.ts](../test/processor/lwc-diff.test.ts)、[lwc-analysis.test.ts](../test/processor/lwc-analysis.test.ts)、[golden.test.ts](../test/ir/golden.test.ts) | 形・Diff・解析。ゴールデンはキーの値を除いた JSON 全体を比べる                                                                                                                    |

### 3.2 型を変えたときの影響

| 変える型                                             | 直す必要があるところ                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `LwcBodyJson` / `LwcBodyContentJson`                 | diff/component.ts の `makeLwcBodyContentDiff`、diff/module.ts の宣言の Diff、analysis.ts の `events`、validate/bundle.ts の `refCallsOf` |
| `LwcCallJson`                                        | diff/component.ts の `LwcCallJsonDiff`、validate/bundle.ts（`refs`）                                                                     |
| `LwcEventJson`                                       | diff/component.ts の `LwcEventJsonDiff`、analysis.ts（`name`）                                                                           |
| `LwcFieldJson` / `LwcPropertyJson` / `LwcMethodJson` | diff/component.ts、analysis.ts（`@api`・`references`）、validate/bundle.ts（名前）、units.ts（`@api`）                                   |
| `LwcDecoratorJson` / `LwcWireConfigJson`             | diff/component.ts、analysis.ts（`name === 'api'`）                                                                                       |
| `LwcDeclarationJson` / `LwcModuleJson`               | diff/module.ts、diff/bundle.ts                                                                                                           |
| `LwcImportJson`                                      | diff/module.ts、analysis.ts、units.ts                                                                                                    |
| どれでも                                             | ゴールデン（[make-golden.ts](../test/ir/make-golden.ts) で作り直す）と保存の版（6.3）                                                    |

### 3.3 調べていて見つけたこと

- **依存関係の `@api` の定義が出ていない（コードを読んだ限り。実行では未確認）。** [units.ts](../src/analyzer/processor/dependency/units.ts#L324-L338) は `member.decorators ?? member.decorator` を見る。JSON のデコレーターは `member.modifier.decorator`（getter / setter は `getterContent.modifier.decorator`）にある。なので `/"api"/` に当たらず、`lwcProperty` の定義が作られないはず。依存関係のコードは別の作業で変えているので、ここでは直さない。
- `report-components-plan.md` の `lwc.apexCalls` は「済」になっているが、src に `lwc.apexCalls` の provider は見つからない（grep）。JSON がそろっている、という意味と読める（未確認）。

## 4. 足りていないもの

### 4.1 一覧

各行はコードで確かめた。「欲しい解析」は、その情報があればできること。

| #   | 失われている情報                            | 今の扱い（確かめたところ）                                                                                                                                                                                                                | 欲しい解析                                                                                                                  |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | 本体の文                                    | `lwcBody.statements`（数）と `objectKey` だけ                                                                                                                                                                                             | 本体の Diff で「どの文が変わったか」。Apex は GumTree で文の追加・削除・移動を出す                                          |
| 2   | 制御構造（`if` / `for` / `try` / `switch`） | なし                                                                                                                                                                                                                                      | Apex の呼び出しが `try` / `catch` の中か、イベントを条件付きで出すか、ループの中の呼び出し                                  |
| 3   | ローカル変数・分割代入                      | なし（`const { recordId } = event.detail` は消える）                                                                                                                                                                                      | イベントの変数と `dispatchEvent` の結び付け、引数の値の出どころ                                                             |
| 4   | `this.<メンバー>` の読み書き                | なし                                                                                                                                                                                                                                      | テンプレート → getter → フィールドの依存、`@api` への代入（LWC で避けるもの）、使っていないフィールド                       |
| 5   | 呼び出しの引数の構造                        | `arg: string[]`                                                                                                                                                                                                                           | Apex の引数名と Apex のパラメータの突き合わせ、引数の Diff                                                                  |
| 6   | `@wire` の設定の値の構造                    | `value` は文字列。`reactive` は値が最上位の `'$x'` のときだけ。スプレッドと、変数で渡した設定は落ちる（[component.ts](../src/analyzer/types/lwc/component.ts#L237-L246)）                                                                 | `fields: ['Account.Name']` のような文字列の項目の参照（今は import の識別子だけを `references` にする）                     |
| 7   | Apex 以外の呼び出し                         | 拾わない。`updateRecord` / `createRecord` / `deleteRecord`・`refreshApex`・`getFieldValue`・LMS の `publish` / `subscribe`・`loadScript` / `loadStyle`・`c/utils` の関数・`LightningConfirm.open` など                                    | レコードの書き込み・メッセージチャネル・静的リソースの使用を、使う場所（メソッド）つきで出す                                |
| 8   | 本体の中の import の参照                    | `LwcBodyContentJson` は `references` を持たない。getter の `getFieldValue(this.record?.data, NAME_FIELD)` の `NAME_FIELD` はメンバーに結び付かない                                                                                        | 項目の利用表をメンバー単位で出す                                                                                            |
| 9   | Apex の呼び出し方                           | callee が import の名前の識別子のときだけ。変数に入れた関数・`.then` / `.catch` / `await` の区別はない                                                                                                                                    | エラー処理のない imperative な呼び出しの指摘、`await` の有無                                                                |
| 10  | イベントのつながり                          | `events` は `new CustomEvent` だけ。`new ShowToastEvent({...})`・`new Event()` は `lwcEvent` にならない。`dispatchEvent(evt)` は `target: 'evt'`                                                                                          | 発行するイベントの一覧の漏れをなくす（変数に入れてから出すイベント）、トーストの文言                                        |
| 11  | `addEventListener` / `removeEventListener`  | 拾わない                                                                                                                                                                                                                                  | 受け取るイベントの一覧（テンプレートの `onxxx` 以外）                                                                       |
| 12  | ナビゲーションのページ参照                  | `arg` の文字列（`{ type: 'standard__recordPage', attributes: {...} }`）                                                                                                                                                                   | `objectApiName` → オブジェクト、`standard__navItemPage` の `apiName` → タブ、`standard__component` → コンポーネントへの参照 |
| 13  | `querySelector` のセレクター                | 引用符ごとの文字列（`"'div'"`）。`this.querySelector`（light DOM）は拾わない。結果へのメソッド呼び出し（`child.refresh()`）も拾わない                                                                                                     | `c-child` → 子のバンドル、子の `@api` メソッドの呼び出し、`data-*` とテンプレートの突き合わせ                               |
| 14  | `refs` の使い方                             | 名前だけ                                                                                                                                                                                                                                  | `this.refs.table.focus()` のようなメソッドの呼び出し                                                                        |
| 15  | 関数を初期値にしたクラスのフィールド        | `handleClick = () => {...}` は `lwcField` で、`init` の文字列と `references` だけ。`calls` / `events` を持たない（[makeFieldJson](../src/analyzer/types/lwc/component.ts#L639-L655)）                                                     | このハンドラーの中の `dispatchEvent` が `analyzeLwcComponent` の `events` に出ない。`this.refs` も検証されない              |
| 16  | コンポーネント以外のクラス                  | メンバーを落とす                                                                                                                                                                                                                          | ユーティリティのクラス・基底クラスのメンバー                                                                                |
| 17  | ユーティリティのモジュールの関数            | `lwcDeclaration` に引数・戻り値の型・`calls`（Apex など）はある。`function` 宣言の `references` はいつも `[]`、関数を初期値にした変数は `init` 全体から `references` を作る（[module.ts](../src/analyzer/types/lwc/module.ts#L170-L192)） | モジュールをまたぐ呼び出しグラフ（`accountList` → `c/utils.formatAmount`）                                                  |
| 18  | export の形                                 | `export default function` / 式・`export * from` は落ちる。`export { a } from './b'` は名前だけ                                                                                                                                            | 再エクスポートをたどった名前の解決                                                                                          |
| 19  | 直下の式の文                                | 落ちる                                                                                                                                                                                                                                    | モジュールを読んだときに動く処理（登録など）                                                                                |
| 20  | 動的 import                                 | `import('c/x')` は拾わない                                                                                                                                                                                                                | 動的コンポーネント（`lwc:component`）の候補                                                                                 |
| 21  | JS に特有の式                               | アロー関数・オプショナルチェーン・テンプレートリテラル・`await`・スプレッドはすべて文字列の中                                                                                                                                             | 式の Diff。`?.` の追加などの小さな変更の分類                                                                                |
| 22  | 引数の既定値                                | 落とす（`optional: true` だけ）                                                                                                                                                                                                           | 既定値の変更の Diff                                                                                                         |
| 23  | 依存関係の参照の場所                        | import 単位。`from.member` を持たない。Apex は使っていなくても import があれば `calls` になる。`@wire` と imperative の区別もない                                                                                                         | 「どのメソッドが Apex のどのメソッドを呼ぶか」。Apex 側の参照（`from.member`・文・式のキー）と同じ細かさ                    |

### 4.2 Apex と比べた違い

| 観点           | Apex                                                                                                                                             | LWC（今）                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| メソッドの本体 | `block: StatementJson[]`（[declaration.ts](../src/analyzer/types/apex/declaration.ts#L70-L75)）                                                  | `body: { statements: number }` と `calls` / `events` |
| 文             | 19 種類の境界ノード（[statement.ts](../src/analyzer/types/apex/statement.ts#L591-L611)）                                                         | なし                                                 |
| 式             | `BaseExpressionJson`（[expression.ts](../src/analyzer/types/apex/expression.ts#L401-L413)）。呼び出しは `memberAccess` で引数 `memberArg` を持つ | 文字列                                               |
| ローカル変数   | `LocalVariableDeclarationJson`（[declaration.ts](../src/analyzer/types/apex/declaration.ts#L312)）                                               | なし                                                 |
| 本体の Diff    | GumTree（[gumtree/tree.ts](../src/analyzer/processor/Apex/diff/gumtree/tree.ts)）                                                                | `lwcBody` の値の比較だけ                             |
| 依存関係の場所 | メンバー・文・式のキー                                                                                                                           | import の位置だけ                                    |

## 5. 型にするべきタイプの案

### 5.1 方針

- **名前**: テンプレートにすでに `lwcIf` / `lwcForEach` / `lwcText` と `LwcExpressionJson`（[template.ts](../src/analyzer/types/lwc/template.ts#L35)）がある。JS の文・式は `kind` を `js` で始め、型名を `LwcJs*Json` にする案（例: `jsIf` / `LwcJsIfStatementJson`）。決めていない（7 章）。
- **形は Apex に合わせる**。文は境界ノード、式は「位置だけ」、呼び出し（`memberAccess`）だけ境界ノード。Apex と同じ考え方の文は、プロパティ名も Apex に合わせる（`conditionBlock`、`memberArg` など）。
- **式の種類は明示する**。Apex は kind のない式の種類を形から決めている（`getExpressionLabel`）。LWC は式の種類が多いので、`expressionType` を持たせる案。
- **文字列も残す**。読みやすさのため、式には `text`（ソースの文字列）を任意で残す案。JSON が大きくなるので、残す場所は決める（7 章）。
- **`calls` / `events` は当面残す**。文と式を JSON にしたあとも、Diff・検証・解析が使っているので、すぐには消さない。最後に解析（`processor/Lwc/analysis`）へ移すかを決める。

優先度の基準: **高** = 今の解析・検証の漏れを直す、または依存関係・Diff の精度に直結する。**中** = 新しい解析ができる。**低** = 完全さのため。

### 5.2 宣言

| 型（案）                      | kind（案）               | 区分              | IR のノード                                                                                 | フィールド（案）                                                                                                                               | 優先度 | 理由                                                                                                                     |
| ----------------------------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `LwcFieldJson` に関数の中身   | （`lwcField`）           | 既存に足す        | `classProperty` の初期値が `arrowFunctionExpression` / `functionExpression`                 | `function?: { param, returnType?, async } & LwcBodyContentJson`                                                                                | 高     | 4.1 の 15。イベント・`refs` の漏れを直す。型を足すだけで済む                                                             |
| `LwcJsBlockJson`（本体）      | なし（配列）             | 入れ物            | `blockStatement`                                                                            | `block: LwcJsStatementJson[]`（Apex の `block: StatementJson[]` と同じ）                                                                       | 高     | 4.1 の 1。`lwcBody` を置き換える                                                                                         |
| `LwcJsLocalVariableJson`      | `jsLocalVariable`        | 境界（文）        | `variableDeclaration`（本体の中）                                                           | `variableKind: 'const' \| 'let' \| 'var'`、`variants: LwcJsVariantJson[]`                                                                      | 高     | 4.1 の 3。Apex の `localVariable` + `VariantJson` に当たる                                                               |
| `LwcJsVariantJson`            | なし                     | 位置だけ          | `variableDeclarator`                                                                        | `sourceKeys`、`target: LwcJsPatternJson`、`variantType?: LwcTypeJson`、`init?: LwcJsExpressionJson`                                            | 高     | Apex の `VariantJson`（[declaration.ts](../src/analyzer/types/apex/declaration.ts#L54)）と同じ形。名前の代わりにパターン |
| `LwcJsPatternJson`            | なし                     | キーなし          | `identifier` / `objectPattern` / `arrayPattern` / `assignmentPattern` / `restElement`       | `{ type: 'name'; name }` / `{ type: 'object'; properties: { key; value: Pattern; default? }[]; rest? }` / `{ type: 'array'; elements; rest? }` | 中     | JS だけのもの（分割代入）。引数（`LwcParameterJson.variant`）にも使える                                                  |
| `LwcParameterJson` に既定値   | （`lwcParameter`）       | 既存に足す        | `assignmentPattern`                                                                         | `init?: LwcJsExpressionJson`、`pattern?: LwcJsPatternJson`                                                                                     | 低     | 4.1 の 22                                                                                                                |
| `LwcClassJson`                | `lwcClass`               | 境界（Structure） | コンポーネント以外の `classDeclaration`                                                     | `LwcComponentJson` と同じ（`name`、`extend`、`implement`、`block: LwcMemberJson[]`）                                                           | 中     | 4.1 の 16。メンバーの型はそのまま使える                                                                                  |
| `LwcDeclarationJson` の見直し | （`lwcDeclaration`）     | 既存を変える      | 直下の関数・変数                                                                            | 関数は `block`、変数は `init: LwcJsExpressionJson`。`function` 宣言にも `references`                                                           | 中     | 4.1 の 17。`init` に関数全体の文字列を入れるのをやめる                                                                   |
| `LwcExportJson`               | `lwcExport`              | 境界              | `exportNamedDeclaration` の specifier / `exportAllDeclaration` / `exportDefaultDeclaration` | `exportType: 'named' \| 'all' \| 'default'`、`local?`、`exported?`、`source?`、`typeOnly`                                                      | 中     | 4.1 の 18。`otherExports: string[]` を置き換える（または並べて持つ）                                                     |
| 入れ子の関数宣言・クラス      | `jsFunction` / `jsClass` | 境界（文）        | 本体の中の `functionDeclaration` / `classDeclaration`                                       | `LwcDeclarationJson` / `LwcClassJson` と同じ                                                                                                   | 低     | まれ                                                                                                                     |
| `static` ブロック             | `lwcStaticBlock`         | 境界              | `staticBlock`                                                                               | `block`                                                                                                                                        | 低     | LWC ではまれ                                                                                                             |

### 5.3 文

すべて境界ノード（Apex と同じ）。

| 型（案）                       | kind（案）               | IR のノード                                                                   | フィールド（案）                                                                                                 | Apex との対応                                                                                                  | 優先度 | 理由                              |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------- |
| `LwcJsExpressionStatementJson` | `jsExpression`           | `expressionStatement`                                                         | `value: LwcJsExpressionJson`                                                                                     | `expression`（[statement.ts](../src/analyzer/types/apex/statement.ts#L117)）                                   | 高     | 呼び出し・代入のほとんどがこの文  |
| `LwcJsIfStatementJson`         | `jsIf`                   | `ifStatement`                                                                 | `conditionBlock: { condition: 'else' \| LwcJsIfConditionJson; block }[]`                                         | `if`（`else if` を 1 つの列にする形も同じ。[statement.ts](../src/analyzer/types/apex/statement.ts#L196-L230)） | 高     | 4.1 の 2                          |
| `LwcJsTryStatementJson`        | `jsTry`                  | `tryStatement` / `catchClause`                                                | `block: ({ condition: 'try' \| 'finally'; block } \| { condition: 'catch'; param?: LwcJsPatternJson; block })[]` | `try`（catch の型はない。JS は 1 つの `catch`、引数は省略できる）                                              | 高     | 4.1 の 2・9。エラー処理の有無     |
| `LwcJsReturnStatementJson`     | `jsReturn`               | `returnStatement`                                                             | `field?: LwcJsExpressionJson`                                                                                    | `return`                                                                                                       | 高     | getter の値の出どころ（4.1 の 4） |
| `LwcJsThrowStatementJson`      | `jsThrow`                | `throwStatement`                                                              | `value`                                                                                                          | `throw`                                                                                                        | 中     |                                   |
| `LwcJsForStatementJson`        | `jsFor`                  | `forStatement`                                                                | `condition: { initializer?; condition?; update? }`、`block`                                                      | `for`（basic）                                                                                                 | 中     |                                   |
| `LwcJsForOfStatementJson`      | `jsForOf` / `jsForIn`    | `forOfStatement` / `forInStatement`                                           | `variableKind?`、`left: LwcJsPatternJson`、`right`、`await: boolean`、`block`                                    | `for`（enhanced）に近い。`in` / `of` / `for await` は JS だけ                                                  | 中     |                                   |
| `LwcJsWhileStatementJson`      | `jsWhile` / `jsDoWhile`  | `whileStatement` / `doWhileStatement`                                         | `condition`、`block`                                                                                             | `while` / `doWhile`                                                                                            | 低     |                                   |
| `LwcJsSwitchStatementJson`     | `jsSwitch`               | `switchStatement` / `switchCase`                                              | `discriminant`、`cases: { test?: Expr; block }[]`                                                                | `switch` とは形が違う（`when` ではなく `case` の fall-through）                                                | 低     |                                   |
| `LwcJsBreak` / `Continue`      | `jsBreak` / `jsContinue` | `breakStatement` / `continueStatement`                                        | `label?`                                                                                                         | `break` / `continue`（JS はラベルを持てる）                                                                    | 低     |                                   |
| 入れ子のブロック               | なし                     | `blockStatement`                                                              | `LwcJsStatementJson[]`（配列のまま）                                                                             | `StatementJson[]` を文に含めるのと同じ                                                                         | 中     |                                   |
| その他                         | `jsOther`                | `labeledStatement` / `withStatement` / `debuggerStatement` / `emptyStatement` | `text`                                                                                                           | なし                                                                                                           | 低     | 落とさずに位置だけ残す            |

### 5.4 式

`LwcJsExpressionJson` は次の和。`memberAccess` に当たるものだけ境界ノード、ほかは「位置だけ」（`sourceKeys` を持ち `kind` を持たない。Apex の `ExpressionValueKeys`）。識別子は Apex と同じく文字列にする案。

| 型（案）                 | kind / expressionType（案） | 区分     | IR のノード                                                                                                      | フィールド（案）                                                                                                                                     | Apex との対応                                                                                                    | 優先度 |
| ------------------------ | --------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| 識別子・`this` / `super` | なし（文字列）              | キーなし | `identifier` / `thisExpression` / `super`                                                                        | `'recordId'` / `'this'`                                                                                                                              | `PrimaryJson` の文字列                                                                                           | 高     |
| `LwcJsMemberAccessJson`  | `jsMemberAccess`            | 境界     | `memberExpression` / `optionalMemberExpression`、callee がそれである `callExpression` / `optionalCallExpression` | `type: 'object' \| 'method'`、`object`、`operator: '.' \| '?.'`、`member: string`、`computed?: Expr`、`memberArg?: Expr[]`、`optionalCall?: boolean` | `memberAccess`（[expression.ts](../src/analyzer/types/apex/expression.ts#L49-L88)）。`?.()` と `[式]` は JS だけ | 高     |
| `LwcJsCallJson`          | `jsCall`                    | 境界     | callee が識別子・その他の `callExpression`                                                                       | `callee: Expr`、`arg: Expr[]`、`typeArguments?: LwcTypeJson[]`                                                                                       | `MethodCallJson`（識別子の呼び出し）                                                                             | 高     |
| `LwcJsNewJson`           | `new`                       | 位置だけ | `newExpression`                                                                                                  | `newType: string`、`generic?: LwcTypeJson[]`、`arg: Expr[]`                                                                                          | `NewInstanceJson`                                                                                                | 高     |
| `LwcJsLiteralJson`       | `literal`                   | 位置だけ | `stringLiteral` / `numericLiteral` / `booleanLiteral` / `nullLiteral` / `bigIntLiteral` / `regExpLiteral`        | `value: string`、`valueType: 'string' \| 'number' \| 'boolean' \| 'null' \| 'bigint' \| 'regexp'`                                                    | `LiteralPrimaryJson`                                                                                             | 高     |
| `LwcJsObjectJson`        | `object`                    | 位置だけ | `objectExpression` / `objectProperty` / `objectMethod` / `spreadElement`                                         | `properties: ({ key: string; computed?: Expr; value: Expr; shorthand?: boolean } \| { spread: Expr } \| { method: ... })[]`                          | なし（JS だけ）。wire の設定・イベントの options・ページ参照の土台                                               | 高     |
| `LwcJsArrayJson`         | `array`                     | 位置だけ | `arrayExpression`                                                                                                | `elements: (Expr \| { spread: Expr } \| null)[]`                                                                                                     | なし（Apex は `new List<>{...}`）                                                                                | 高     |
| `LwcJsFunctionJson`      | `function`                  | 位置だけ | `arrowFunctionExpression` / `functionExpression`                                                                 | `arrow: boolean`、`async`、`param: LwcParameterJson[]`、`returnType?`、`block` か `expression`                                                       | なし（JS だけ）。`then` のコールバック・ハンドラーのフィールド                                                   | 高     |
| `LwcJsAwaitJson`         | `await`                     | 位置だけ | `awaitExpression`                                                                                                | `value: Expr`                                                                                                                                        | なし（JS だけ）                                                                                                  | 高     |
| `LwcJsFormulaJson`       | `formula`                   | 位置だけ | `binaryExpression` / `logicalExpression` / `assignmentExpression`                                                | `left`、`operator`、`right`                                                                                                                          | `FormulaJson`（[expression.ts](../src/analyzer/types/apex/expression.ts#L287)）。`??`・`??=`・`**` が増える      | 中     |
| `LwcJsUnaryJson`         | `unary`                     | 位置だけ | `unaryExpression` / `updateExpression`                                                                           | `variant`、`operator`（`typeof` / `void` / `delete` を含む）、`operatorLocation`                                                                     | `UnaryJson`                                                                                                      | 中     |
| `LwcJsTernaryJson`       | `ternary`                   | 位置だけ | `conditionalExpression`                                                                                          | `condition`、`trueValue`、`falseValue`                                                                                                               | `TernaryJson`                                                                                                    | 中     |
| `LwcJsTemplateJson`      | `template`                  | 位置だけ | `templateLiteral` / `templateElement` / `taggedTemplateExpression`                                               | `quasis: string[]`、`expressions: Expr[]`、`tag?: Expr`                                                                                              | なし（JS だけ）                                                                                                  | 中     |
| `LwcJsCastJson`          | `cast`                      | 位置だけ | `tSAsExpression` / `tSSatisfiesExpression` / `tSTypeAssertion`                                                   | `target`、`convertType: LwcTypeJson`、`operator: 'as' \| 'satisfies' \| '<>'`                                                                        | `CastJson`。括弧・`x!` は今と同じく外す（`unwrapExpression`）                                                    | 低     |
| `LwcJsImportCallJson`    | `importCall`                | 位置だけ | `importExpression`（と `callee: import` の呼び出し）                                                             | `source?: string`（リテラルのとき）、`arg: Expr[]`                                                                                                   | なし                                                                                                             | 中     |
| `LwcJsSequenceJson` ほか | `other`                     | 位置だけ | `sequenceExpression` / `yieldExpression` / `classExpression` / JSX / Flow など                                   | `text`                                                                                                                                               | 文字列の式（Apex の `makeExpressionJson`）                                                                       | 低     |

JS で Apex と違う形が要るところ:

| 構文                                    | 案                                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| アロー関数                              | `LwcJsFunctionJson`。式の本体（`x => x.id`）は `expression`、ブロックは `block`                                                                |
| 分割代入                                | `LwcJsPatternJson`。ローカル変数・引数・`for of`・`catch` で共通にする                                                                         |
| オプショナルチェーン                    | `operator: '?.'`（Apex と同じ値）。`a?.()` は `optionalCall: true`。`a?.[i]` は `computed` と `operator: '?.'`                                 |
| テンプレートリテラル                    | `LwcJsTemplateJson`。イベント名・セレクターが `` `c-${x}` `` のときは解決できない、と分かるようにする                                          |
| async / await                           | 関数は `async` を持つ（今もある）。`await` は式（`LwcJsAwaitJson`）                                                                            |
| Promise の `then` / `catch` / `finally` | 型は増やさない。`memberAccess`（`member: 'then'`、`memberArg` に `LwcJsFunctionJson`）の連なりとして持ち、解析で「呼び出しのあとの処理」を読む |
| 計算されたメンバー（`this[x]`）         | `computed: Expr`。`this[NavigationMixin.Navigate]` は `computed` が `memberAccess` になる                                                      |

### 5.5 呼び出しと引数

| 型（案）                             | 区分       | フィールド（案）                                                                                                                                                                                                                                                                                                                                                            | 優先度 | 理由                                                                      |
| ------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| 引数 `memberArg` / `arg: Expr[]`     | 式の一部   | 5.4 の式                                                                                                                                                                                                                                                                                                                                                                    | 高     | 4.1 の 5。Apex の `memberArg` と同じ                                      |
| `LwcCallJson` に構造の引数           | 既存に足す | `args?: LwcJsExpressionJson[]`（`arg: string[]` は残す）                                                                                                                                                                                                                                                                                                                    | 高     | 文の JSON を作る前に、今の `calls` だけで引数を使えるようにする           |
| `LwcCallJson.callType` を増やす      | 既存に足す | `lds`（`lightning/uiRecordApi` の `createRecord` / `updateRecord` / `deleteRecord` / `getRecordNotifyChange` / `notifyRecordUpdateAvailable`）、`refreshApex`、`messageService`（`publish` / `subscribe` / `unsubscribe`）、`platformResource`（`loadScript` / `loadStyle`）、`module`（`c/...`・相対パスの import の関数）、`listener`（`addEventListener`）、`importCall` | 高     | 4.1 の 7・11・17。import の名前と import 元で決まるので、今の作りに足せる |
| `LwcCallJson` に Apex の呼び方       | 既存に足す | `apexCall?: { awaited: boolean; then: boolean; catch: boolean; inTry: boolean }`                                                                                                                                                                                                                                                                                            | 中     | 4.1 の 9。文の JSON ができれば解析で出せるので、それまでのつなぎ          |
| `LwcBodyContentJson` に `references` | 既存に足す | `references: LwcImportReferenceJson[]`（本体の中の import の参照）                                                                                                                                                                                                                                                                                                          | 高     | 4.1 の 8。項目の利用表をメンバー単位にする。フィールド・宣言は今も持つ    |

### 5.6 LWC に固有のもの

| 型（案）                     | kind（案）              | 区分         | もとの IR                                                         | フィールド（案）                                                                                                                          | 優先度 | 理由                                                                                                                 |
| ---------------------------- | ----------------------- | ------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `LwcWireConfigJson` の値     | （`lwcWireConfig`）     | 既存に足す   | `objectProperty` の値                                             | `valueExpression: LwcJsExpressionJson`、`reactive` を入れ子・配列の中の `'$x'` にも、`fieldNames?: string[]`（`'Account.Name'` の文字列） | 高     | 4.1 の 6。文字列で書いた項目の参照を依存関係に出す                                                                   |
| `LwcDecoratorJson.args`      | （`lwcDecorator`）      | 既存に足す   | `decorator` の引数                                                | `args?: LwcJsExpressionJson[]`                                                                                                            | 低     | `@wire` 以外のデコレーターの引数はまれ                                                                               |
| `LwcEventJson` の見直し      | （`lwcEvent`）          | 既存を変える | `newExpression`                                                   | `eventClass: 'CustomEvent' \| 'Event' \| 'ShowToastEvent' \| string`、`options?: LwcJsObjectJson`、`detail?: Expr`、`dispatched: boolean` | 中     | 4.1 の 10。変数に入れてから出すイベント、トーストの `title` / `variant`                                              |
| `LwcToastJson`               | `lwcToast`              | 境界         | `new ShowToastEvent({...})`                                       | `title?`、`message?`、`variant?`、`mode?`（文字列か式）、ラベルの import の参照                                                           | 低     | 文言とカスタム表示ラベルの結び付け。`LwcEventJson` に入れるなら要らない                                              |
| `LwcNavigationJson`          | `lwcNavigation`         | 境界         | `this[NavigationMixin.Navigate / GenerateUrl](pageRef, replace?)` | `method`、`pageType?`（`standard__recordPage` など）、`attributes: Record<string, string \| Expr>`、`state?`、`replace?`                  | 中     | 4.1 の 12。`objectApiName` / タブ / コンポーネントへの参照を依存関係に出す。ページ参照が変数のときは `pageType` なし |
| `LwcQueryJson`               | `lwcQuery`              | 境界         | `this.template.querySelector(All)` / `this.querySelector(All)`    | `root: 'template' \| 'host'`、`all: boolean`、`selector?: string`（リテラルの値）、`tags?: string[]`、`dataAttributes?: string[]`         | 中     | 4.1 の 13。`c-child` を子のバンドルに、`data-*` をテンプレートに結び付ける                                           |
| `LwcRefUseJson`              | （`lwcCall` の `refs`） | 既存に足す   | `this.refs.<名前>` と、それへのメンバーの参照                     | `name`、`member?: string`（`focus` など）                                                                                                 | 低     | 4.1 の 14                                                                                                            |
| `LwcMemberUseJson`           | なし                    | 解析の結果   | `this.<名前>` の `memberAccess`                                   | `member`、`access: 'read' \| 'write' \| 'call'`、`sourceKeys`                                                                             | 中     | 4.1 の 4。式の JSON があれば解析で出せるので、JSON の型にはしない案                                                  |
| `LwcExportJson`・動的 import | 5.2 / 5.4               |              |                                                                   |                                                                                                                                           | 中     | 4.1 の 18・20                                                                                                        |
| ライフサイクル               | なし                    | 解析の結果   | メソッド名（`connectedCallback` など）                            | なし                                                                                                                                      | 低     | 名前で決まるので型は要らない                                                                                         |

### 5.7 案のまとめ（優先度順）

| 優先度 | 型（案）                                                                                                                                                                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 高     | `LwcFieldJson` の関数の中身、`LwcBodyContentJson.references`、`LwcCallJson` の `callType` を増やす・`args`、`LwcWireConfigJson` の値の構造、本体の文（`jsExpression` / `jsIf` / `jsTry` / `jsReturn` / `jsLocalVariable`）、式（識別子・`jsMemberAccess`・`jsCall`・`new`・`literal`・`object`・`array`・`function`・`await`） |
| 中     | `LwcJsPatternJson`、`LwcClassJson`、`LwcDeclarationJson` の見直し、`LwcExportJson`、`jsFor` / `jsForOf` / `jsThrow`、`formula` / `unary` / `ternary` / `template` / `importCall`、`LwcEventJson` の見直し、`LwcNavigationJson`、`LwcQueryJson`、`apexCall`、`LwcMemberUseJson`（解析）                                         |
| 低     | 引数の既定値、入れ子の関数・クラス、`static` ブロック、`jsWhile` / `jsSwitch` / `jsBreak` / `jsOther`、`cast` / `other`、`LwcDecoratorJson.args`、`LwcToastJson`、`LwcRefUseJson`                                                                                                                                              |

## 6. 進め方の案

### 6.1 順番

前の段階を壊さず、1 段階ごとにゴールデン（[golden.test.ts](../test/ir/golden.test.ts)）と Diff のテストが通る状態にする。

| 段階 | やること                                                                                                                                                                                                                                      | 変わる JSON                         | 直すところ                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1    | 足すだけの変更。関数を初期値にしたフィールドに本体の中身、`LwcBodyContentJson.references`、`callType` を増やす                                                                                                                                | プロパティが増える                  | diff/component.ts、analysis.ts（`events` をフィールドからも集める）、validate/bundle.ts（`refCallsOf`） |
| 2    | 式の JSON（5.4）を作る。まず今の文字列の隣に置く（`LwcCallJson.args`、`LwcWireConfigJson.valueExpression`、`LwcEventJson.detail` の式）                                                                                                       | プロパティが増える                  | 式の Diff（値として比べる。GumTree は段階 4）                                                           |
| 3    | LWC 固有の型（`LwcNavigationJson`・`LwcQueryJson`・wire の項目名・`LwcEventJson` の見直し）。依存関係で使う                                                                                                                                   | 型が増える                          | units.ts（依存関係の担当と相談）、解析                                                                  |
| 4    | 文の JSON（5.3）。`lwcBody` を `block: LwcJsStatementJson[]` に置き換える。本体の Diff を GumTree にする（`commons/diff/gumtree` に LWC の `GumTreeLanguage` を足す。Apex は [tree.ts](../src/analyzer/processor/Apex/diff/gumtree/tree.ts)） | `lwcBody` がなくなる                | diff/component.ts・diff/module.ts、`LwcBodyJsonDiff` を消す                                             |
| 5    | モジュールの直下（`LwcClassJson`・`LwcExportJson`・`export default function`・`export *`・直下の式の文・動的 import）                                                                                                                         | 型が増える・`otherExports` を変える | diff/module.ts                                                                                          |
| 6    | 解析の走査（Apex の [apex-json-analysis.md](./apex-json-analysis.md) 2 章の walker と同じ形）を作り、`calls` / `events` を解析から出すか決める                                                                                                | `calls` / `events` を消すなら減る   | analysis.ts・validate/bundle.ts・diff                                                                   |

- 段階 1〜3 は今の `calls` / `events` の作りに足すだけなので、小さく出せる。
- 段階 4 がいちばん大きい。式（段階 2）が先にあると、文は式を入れる入れ物を作るだけで済む。
- 段階ごとに、JSON の大きさ（`sourceObject` の数）を測る。`keysOf` は使ったノードの位置をすべて `sourceObject` に登録するので（[commons.ts](../src/analyzer/types/lwc/commons.ts#L40-L65)）、式を細かくすると増える。どれくらい増えるかは **未確認**。

### 6.2 ゴールデン

- ゴールデンはキーの値（`objectKey` / `sourceKey`）を除いた JSON 全体を比べる（[golden.ts](../test/ir/golden.ts)）。JSON の形を変えると必ず違いが出る。
- 段階ごとに `npx ttsx --noCheck test/ir/make-golden.ts` で作り直し、違いが「増えたプロパティだけ」であることを確かめてから入れる。
- 段階 4 で `lwcBody` を消すときは、違いが大きくなる。`lwcBody` の代わりの `block` が増えたことと、ほかが変わっていないことを分けて確かめる。
- サンプルのリポジトリ（[docs/examples/repository/](./examples/README.md)）に、足りない構文（関数のフィールド、`then` / `catch`、ナビゲーション、`querySelector('c-child')`、文字列の `fields`）を足すと、ゴールデンで確かめられる。

### 6.3 保存の版

- 保存データは `SAVE_FORMAT_VERSION`（[parser/commons.ts](../src/analyzer/parser/commons.ts#L40-L46)、今は 4）が違うと読まず、解析し直す。
- JSON の形を変える段階を出すたびに上げ、コメントに何を変えたかを書く（例: `5: LWC の本体に関数のフィールドの中身・references を足した`）。
- 同じリリースに入れる段階はまとめて 1 回上げてもよい。版は Apex・メタデータと共通なので、上げると全部が解析し直しになる。

## 7. 決めていないこと

1. JS の文・式の `kind` の付け方（`js*` / `lwcJs*` / ほか）。テンプレートの `lwcIf` / `LwcExpressionJson` とぶつからないようにする。
2. 式に `text`（ソースの文字列）を残すか。残すなら全部の式か、引数・初期値などの入口だけか。
3. 式の種類を `expressionType` で明示するか、Apex と同じく形から決めるか。
4. `calls` / `events` を JSON に残すか、文と式の JSON ができたら解析に移すか。
5. 文はどこまで細かくするか。Apex と同じく全部の文か、LWC の解析に効くもの（式の文・`if`・`try`・`return`・ローカル変数）だけか。
6. コンポーネント以外のクラスと、ユーティリティのモジュール（`c/utils`）をどこまで対象にするか。
7. JSON の大きさの上限（`sourceObject` の数）。
8. Flow の型・JSX（IR にはある）は対象外のままでよいか。
9. 3.3 の `@api` の定義の件を、依存関係の担当がいつ直すか。
