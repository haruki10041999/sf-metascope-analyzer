# LWC の Diff の実装方針

LWC のバンドル（`lwc/<名前>/`）の解析結果（`LwcBundleParseResult`、JSON は [lwc-json-reference.md](./lwc-json-reference.md)）同士の差分の作り方。
分類（A. スロット / B. 集合 / C. 順序付き列 / D. キー対応）、`status`、`match`、出力の形は Apex と同じ（[apex-json-diff-policy.md](./apex-json-diff-policy.md)）。

## 1. 方針

- **部品は Apex・メタデータと共通のものだけを使う。** LWC 専用に書くのは「kind ごとに、どのプロパティをどの分類で比べるか」だけにする（メタデータの [Metadata/diff/object.ts](../src/analyzer/processor/Metadata/diff/object.ts) と同じ書き方）。
- **共通にできるものは `processor/commons/diff/` に移す。** 今回、Apex・メタデータの中にあった次の 3 つを移した（動作は変えていない。Apex・メタデータの Diff の出力が変わらないことを確認済み）。

| 移したもの                                             | 元の場所                                 | 移した先                                                                                                         |
| ------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GumTree の本体（木の作り方・対応付け・差分への変換）   | `processor/Apex/diff/gumtree/`           | [commons/diff/gumtree/](../src/analyzer/processor/commons/diff/gumtree/)（`tree.ts` / `matcher.ts` / `diff.ts`） |
| 解析の単位（フォルダ・バンドル）を id で対応付ける差分 | `processor/Metadata/diff/unit.ts` の中   | [commons/diff/unit.ts](../src/analyzer/processor/commons/diff/unit.ts)（`makeIdUnitDiffs`）                      |
| kind を持たない object の差分（`makePlainDiff`）       | `processor/Apex/diff/expression.ts` の中 | [commons/diff/list.ts](../src/analyzer/processor/commons/diff/list.ts)（`makeTypedObjectDiff`）                  |

### 1.1 GumTree の共通化

GumTree の木を作る処理のうち、言語ごとに違うのは「ノードのラベルの付け方」などだけなので、それを `GumTreeLanguage` として渡す形にした。

| `GumTreeLanguage` の項目 | 意味                                                      | Apex（`APEX_GUMTREE_LANGUAGE`）                                |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------- |
| `nodeLabel`              | JSON ノードのラベル（既定は `kind`）                      | `forCondition:enhanced` など、同じ kind で形が違うものを分ける |
| `valueLabel`             | kind を持たない値のラベル（既定は `<親>.<プロパティ名>`） | 式の形（`formula` / `ternary` / `cast` ...）・if の節など      |
| `isOrdered`              | 子の順序が意味を持つか（既定はすべて順序あり）            | 修飾子・`switch` の値・SELECT の項目などは順序なし             |
| `isBlockRole`            | 文の並び（block）を持つプロパティか                       | `block` / `body`（try / switch の節の並びは除く）              |
| `isAtomicArray`          | 配列全体を 1 つの値として比べるか                         | catch の例外型                                                 |
| `leafValues`             | 中身を比べずに葉にするノード                              | 型（`type`）                                                   |
| `groupProperty`          | 子を 1 つの並びにまとめ直すプロパティ                     | 修飾子（分類キーをまたいで 1 つの順序なしの並び）              |

`makeGumTreeBuilder(language)` が `makeBlockTree` を返し、対応付け（`matchTrees`）と差分への変換（`makeGumTreeDiff`）は言語に依らない。

**LWC の JS / TS では、いまは GumTree を使わない。** GumTree は「文の並び（block）の中で、文の移動・入れ子の変化を対応付ける」ためのもので、Apex ではメソッドの本体に使っている。LWC の JSON は本体を文の木にせず、解析に要る情報（呼び出し `lwcCall`・イベント `lwcEvent`・文の数 `lwcBody`）だけを持つので、比べる木がない。テンプレート（HTML）の要素の木は、`LWC_TEMPLATE_GUMTREE_LANGUAGE` を書いて同じ GumTree を使っている（3.4）。本体の文を JSON にするときも、`GumTreeLanguage` を 1 つ書けば使える。

### 1.2 単位の差分の共通化

`makeIdUnitDiffs(before, after, { dataType, make })` は、解析結果の一覧を `result.id` で対応付け、次を共通で行う。

- 片方にしかない単位は `added` / `removed`、両方にあれば `changed` / `unchanged`。
- `filePath` / `dataType` は同じなら単体、違えば `{ before, after }`。
- `resolvedError` は B. 集合（objectKey で対応付け）。
- 中身（`content`）は、どちらも読めたら `make` の結果、どちらも読めなかったら `ErrorJsonDiff`、片方だけ読めたら持たない（`dataType` の違いで分かる）。

| 解析の単位                                 | id                                                     | 呼び出し                                            |
| ------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------- |
| オブジェクト                               | API 名                                                 | `makeObjectUnitDiffs`（`dataType: 'object'`）       |
| オブジェクトの翻訳                         | `<オブジェクト>-<言語>`                                | `makeObjectTranslationUnitDiffs`                    |
| **LWC のバンドル**                         | **バンドル名**                                         | **`makeLwcBundleDiffs`（`dataType: 'lwcBundle'`）** |
| Apex の単位（クラス・トリガー・匿名 Apex） | `class_<名前>` / `trigger_<名前>` / `anonymous_<名前>` | `makeApexUnitDiffs`（`dataType: 'apexUnit'`）       |

Apex も単位（クラス・トリガーはソースと -meta.xml、匿名 Apex は 1 ファイル）で、id（`class_<名前>` / `trigger_<名前>` / `anonymous_<名前>`）で対応付ける `makeApexUnitDiffs`（`processor/Apex/diff/unit.ts`。中で `makeIdUnitDiffs` を使う）。

## 2. ファイル

| ファイル                                                                             | 主なもの                                                                                                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| [processor/Lwc/diff/bundle.ts](../src/analyzer/processor/Lwc/diff/bundle.ts)         | `makeLwcBundleDiffs`（入口）、`makeLwcBundleDiff`、`LwcBundleUnitDiff`                                                        |
| [processor/Lwc/diff/module.ts](../src/analyzer/processor/Lwc/diff/module.ts)         | `makeLwcModuleDiff`（import・モジュールの直下の宣言・interface / type / enum）                                                |
| [processor/Lwc/diff/component.ts](../src/analyzer/processor/Lwc/diff/component.ts)   | `makeLwcComponentDiff`（クラスとメンバー）、`makeLwcModifiersDiff`（修飾子・デコレーター・`@wire`）、`makeLwcBodyContentDiff` |
| [processor/Lwc/diff/template.ts](../src/analyzer/processor/Lwc/diff/template.ts)     | `makeLwcTemplateDiff`、`LWC_TEMPLATE_GUMTREE_LANGUAGE`（HTML）                                                                |
| [processor/Lwc/diff/stylesheet.ts](../src/analyzer/processor/Lwc/diff/stylesheet.ts) | `makeLwcStylesheetDiff`（CSS）                                                                                                |
| [processor/Lwc/diff/meta.ts](../src/analyzer/processor/Lwc/diff/meta.ts)             | `makeLwcBundleMetaDiff`（js-meta.xml）                                                                                        |
| [test/processor/lwc-diff.test.ts](../test/processor/lwc-diff.test.ts)                | サンプル（`docs/examples/lwc/samples/diff`）での確認                                                                          |

## 3. 分類

使う共通部品: JSON ノード 1 組は `makeNodeDiff`、配列は `makeKeyedDiff`（D）/ `makeSequenceDiff`（C）/ `makeSetDiff`（B）、kind を持たない値の配列は `makeTypedListDiff` + `pairByKey`（D）/ `makeOrderedValuesDiff`（C）/ `makeUnorderedValuesDiff`（B）、kind を持たない object は `makeTypedObjectDiff`、ないことがある値は `makePresentDiff` + `presentEntry`、値は `makeValueDiff`。

### 3.1 バンドル・モジュール

| 対象                          | プロパティ         | 分類 | 識別キー・備考                                                                                             |
| ----------------------------- | ------------------ | ---- | ---------------------------------------------------------------------------------------------------------- |
| バンドル（`LwcBundleJson`）   | `modules`          | D    | ファイル名（`fileName`）。中身は、どちらも読めたら `makeLwcModuleDiff`、どちらもエラーなら `ErrorJsonDiff` |
|                               | `skippedFiles`     | B    | 値ごと                                                                                                     |
| モジュール（`LwcModuleJson`） | `imports`          | D    | `import 元`（`import type` は `type <import 元>`。同じ import 元を値と型で 2 回書けるため）                |
|                               | `component`        | A    | default export のクラスは 1 つ                                                                             |
|                               | `otherExports`     | B    | export 名                                                                                                  |
|                               | `declarations`     | D    | 名前。名前を読めなかったもの（ErrorJson）は B                                                              |
|                               | `typeDeclarations` | D    | 名前                                                                                                       |
|                               | `errors`           | B    | objectKey                                                                                                  |
| `lwcImport`                   | `specifiers`       | D    | モジュールの中の名前（`local`）                                                                            |
| `lwcTypeDeclaration`          | `extend`           | B    |                                                                                                            |
|                               | `members`          | D    | メンバー名。メンバーは kind を持たないので、型ごと値として比べる                                           |
|                               | `enumMembers`      | C    | enum の値は並び順で決まる                                                                                  |

### 3.2 コンポーネント

| 対象                                         | プロパティ    | 分類 | 識別キー・備考                                                          |
| -------------------------------------------- | ------------- | ---- | ----------------------------------------------------------------------- |
| `lwcComponent`                               | `block`       | D    | メンバー名（static は `static <名前>`）。Apex のクラスの `block` と同じ |
|                                              | `mixins`      | C    | mixin は外側から順に適用される                                          |
|                                              | `implement`   | B    |                                                                         |
| `lwcMethod` / `lwcConstructor` / 宣言の関数  | `param`       | C    | 位置で意味が決まる（Apex のパラメータと同じ）                           |
| 本体を持つもの（`LwcBodyContentJson`）       | `calls`       | C    | 書かれた順。`callType` が同じものだけを対応付ける                       |
|                                              | `events`      | C    | 書かれた順                                                              |
|                                              | `body`        | A    | `lwcBody`（下の 4 章）                                                  |
| 修飾子（`LwcModifiersJson`）                 | `declaration` | B    | `static` / `readonly` など                                              |
|                                              | `decorator`   | D    | デコレーター名（`api` / `track` / `wire`）。Apex のアノテーションと同じ |
| `lwcDecorator`                               | `arg`         | C    | 引数の文字列                                                            |
| `@wire`（`wire`）                            | `config`      | D    | 設定のキー（`recordId` など）                                           |
| フィールド・宣言・`lwcCall`・`lwcWireConfig` | `references`  | B    | 使っている import（`local` で決まる）                                   |
| 型（`lwcType`）                              | —             | 値   | Apex の型と同じく葉。書かれた型の文字列ごと比べる                       |

### 3.3 CSS（[diff/stylesheet.ts](../src/analyzer/processor/Lwc/diff/stylesheet.ts)）

木が浅いので GumTree は使わない。

| 対象            | プロパティ     | 分類 | 識別キー・備考                                                                                                         |
| --------------- | -------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| バンドル        | `stylesheets`  | D    | ファイル名                                                                                                             |
| `lwcStylesheet` | `rules`        | C    | 並び順が優先順位に効く。内容の違う規則は「セレクターが 1 つでも共通」（at 規則は「名前が同じ」）なら変更として組にする |
|                 | `imports`      | C    | 読み込む順                                                                                                             |
| `cssRule`       | `selectors`    | B    |                                                                                                                        |
|                 | `declarations` | D    | `prop`。同じ `prop` が複数ある（フォールバック）ときは `prop#2` のように出現順を足す                                   |
| `cssAtRule`     | `rules`        | C    | `lwcStylesheet` の `rules` と同じ                                                                                      |

セレクターを足した規則（`.a, .b` → `.a, .b, .c`）は削除・追加ではなく `selectors` への追加、`@media` の条件の変更は `params` の変更になる。

### 3.4 HTML（[diff/template.ts](../src/analyzer/processor/Lwc/diff/template.ts)）

バンドルの `templates` はファイル名で D。要素の木は GumTree で対応付ける。`<template lwc:if>` で囲む・外す、`<div>` で包むといった変更で要素の深さが変わるため（順序付き列だと、深さが変わった要素はすべて削除と追加になる）。出力は GumTree の差分（`GumTreeDiff`。`label` / `status` / `sourceKeys` / `index`、変わったノードは `fields` と `children`）をそのまま使う。

| `LWC_TEMPLATE_GUMTREE_LANGUAGE` | 設定                                                                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodeLabel`                     | `lwcElement` は `element:<tag>`（違うタグ同士は対応付けない）、`lwcForEach` は `lwcForEach:<iteratorType>`、ほかは kind                                                                  |
| `isBlockRole`                   | `children`（要素の並び）                                                                                                                                                                 |
| `leafValues`                    | `lwcText` は葉（`text` で比べる）                                                                                                                                                        |
| `fieldValues`                   | 要素の `attributes` / `directives` / `events` / `metadataRefs` は名前ごとの値（`label` / `lwc:ref` / `onclick` / `ref:field-name`）。分岐の条件・繰り返しの対象・`component` は 1 つの値 |

- **属性は木のノードにせず、要素の値（`fields`）にする。** 属性をノードにすると、`slot="actions"` や空の `directives` のような小さな同形のノードがほかの要素の側にもあり、要素の対応付けがそちらに引っ張られる。値にすると、属性の違いは要素の `fields` に属性名ごとに出る（属性名で対応付ける D と同じ）。属性 1 つの位置は、JSON の `lwcAttribute` の sourceKeys で引ける。
- 例: 「更新」ボタンの文言を変える → `fields.label` が `更新` → `再読み込み`。`<p>` を `<template lwc:if>` で囲む → 追加した `lwcIf` の中に `<p>` が `moved`。

### 3.5 js-meta.xml（[diff/meta.ts](../src/analyzer/processor/Lwc/diff/meta.ts)）

メタデータ（[metadata-diff-policy.md](./metadata-diff-policy.md)）と同じ書き方。バンドルの `meta` は A（どちらにもなければ持たない）。値は `makePropertiesDiff`、`targets` / `capabilities` / `objects` / `supportedFormFactors` は B、`targetConfigs` は D（`targets` を並べ替えてつないだもの）、`properties` は D（`name`）。

## 4. 判断の補足

- **メンバーの種類が変わったとき**（フィールド → getter など）は、同じ名前なので対応付くが、kind が違うので `makeNodeDiff` が中身を比べずに値を丸ごと `before` / `after` に入れる（Apex で宣言の種類が変わったときと同じ）。
- **`lwcBody` は、本体の文字列が変われば文の数（`statements`）が同じでも `changed`** になる（objectKey が本体の内容から作られるため）。`fields.statements` が `unchanged` の `changed` は「文の数は同じで中身が変わった」と読む。本体の中の解析に要る変化は `calls` / `events` に出る。
- **kind を持たない入れ物**（バンドル、モジュール、`@wire`、修飾子、getter / setter の中身）は `TypedObjectDiff`（値が同じなら `unchanged`、違えばプロパティごとの `fields`）。Apex の kind を持たない式（`new` など）と同じ形。
- **`resolvedError`**（すべてのファイルの診断とバンドルの中の突き合わせ）は、単位の差分（`makeIdUnitDiffs`）で B. 集合として比べる。JSON の中の `ErrorJson` は、各配列で「識別キーを持たないもの」として B. 集合で比べる。
- **JS の本体の文の対応付け（GumTree）はしない**（1.1 章）。

## 5. サンプル

[examples/lwc/](./examples/lwc/)（`samples/diff/before` → `after`、結果は `output/diff/`。実行は `npx ttsx --noCheck docs/examples/lwc/scripts/run-diff.ts`）。変更点と、出る差分:

| バンドル                  | 変更                                                                                     | 差分                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `accountList`（JS）       | ラベルの import を削除し Apex の import を追加                                           | `imports`: removed / added（D）                                                                                                              |
|                           | `title` の初期値をラベル → 文字列、`maxRows` の初期値 10 → 20                            | `block[title].init`・`references`、`block[maxRows].init`                                                                                     |
|                           | `@wire(getAccounts)` の設定に `industry: '$industry'` を追加                             | `decorator[wire].wire.config[industry]`: added（D）、`arg[1]`: changed                                                                       |
|                           | getter `isTable` を削除、`@api industry`・`handleSave` を追加                            | `block`: removed / added。HTML はまだ `isTable` を使うので `resolvedError` に `TEMPLATE_UNKNOWN_MEMBER`                                      |
|                           | イベント `accountselect` の `composed` を false → true                                   | `block[handleSelect].events[0].composed`: changed（C）                                                                                       |
| `accountList`（HTML）     | ボタンの文言・属性の変更とボタンの追加、`<p>` を `lwc:if` で囲む、文言の変更、要素の削除 | 3.4 の例                                                                                                                                     |
| `accountList`（CSS）      | カスタムプロパティの値、セレクターの追加、規則の追加、`@media` の条件                    | 3.3 の例                                                                                                                                     |
| `accountList`（js-meta）  | `apiVersion`、`targets` の追加、`property` の変更・追加、`capabilities` の追加           | `meta` の値・`targets`・`targetConfigs[0].properties`・`capabilities`                                                                        |
| `utils`                   | type の右辺・interface のメンバー・関数の引数を追加、enum を追加                         | `typeDeclarations[SortDirection].variantType`、`[Row].members[industry]`: added、`declarations[toRows].param[1]`: added、`[ViewKind]`: added |
|                           | enum は LWC Compiler が扱えない                                                          | `resolvedError`: added（`TS_UNSUPPORTED`）                                                                                                   |
| `oldBanner` / `newBanner` | バンドルの削除・追加                                                                     | 単位ごと removed / added                                                                                                                     |
| `accountRow` / `broken`   | 変更なし（`broken` は LWC の仕様違反を含む）                                             | unchanged                                                                                                                                    |

## 6. 今後

- JS の本体の文を JSON にする場合も、`GumTreeLanguage` を書けば Apex と同じ文の対応付けを使える。
