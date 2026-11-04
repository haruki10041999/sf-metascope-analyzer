# オブジェクトのメタデータ JSON の Diff 方針

[metadata-json-reference.md](./metadata-json-reference.md) の JSON について、変更前（`before`）と変更後（`after`）の差分の取り方をまとめる。分類（A〜D）、status、`match`、出力の形（kind / sourceKeys と中身の分離、`sourceKeys` の objectKey / sourceKey ごとのまとめ方、配列の要素を 1 段にする形）は Apex と同じで、[apex-json-diff-policy.md](./apex-json-diff-policy.md) に従う。共通部品（`NodeDiff`・`makeKeyedDiff`・`makeTypedListDiff` など）も Apex のものを使う。

## 1. 単位

- オブジェクトは **API 名**で対応付ける（Apex はファイルのパス）。片方にしかなければ `added` / `removed`。
- `ObjectUnitDiff`（[diff/unit.ts](../src/analyzer/processor/Metadata/diff/unit.ts)）は `id`、`status`、`filePath`、`dataType`（同じなら単体、違えば `{ before, after }`）、`resolvedError`（読めなかったファイル。B. 集合、objectKey で対応付け）、`content`（どちらも読めたら `CustomObjectJsonDiff`、どちらも読めなかったら `ErrorJsonDiff`）を持つ。
- 中身か `resolvedError` に変化があれば `changed`。位置だけの変化（空行の追加など）は `objectKey` が同じなので `unchanged`。

## 2. kind ごとの方針

| kind                 | Diff の型                      | 親の中での分類            | 子の比較                                                                                                                   |
| -------------------- | ------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `object`             | `CustomObjectJsonDiff`         | ユニット直下（A）         | `apiName` / `objectType` / スキーマの値: 値（任意項目は `added` / `removed`） / `nameField`: 値 / 子の 7 種類: **D**（下） |
| `field`              | `CustomFieldJsonDiff`          | **D**（キー: `apiName`）  | スキーマの値: 値 / `valueSet`: 任意項目（中は `ValueSetJsonDiff`）                                                         |
| `picklistValue`      | `PicklistValueJsonDiff`        | **D**（キー: `fullName`） | 値。並び順の変化は報告しない                                                                                               |
| `validationRule`     | `ValidationRuleJsonDiff`       | **D**（キー: `fullName`） | 値                                                                                                                         |
| `recordType`         | `RecordTypeJsonDiff`           | **D**（キー: `fullName`） | 値 / `picklistValues`: **D**（キー: `picklist`）                                                                           |
| `recordTypePicklist` | `RecordTypePicklistJsonDiff`   | D の要素                  | `values`: **B**（使える値の集合。順は項目の選択リスト値で決まる）                                                          |
| `listView`           | `ListViewJsonDiff`             | **D**（キー: `fullName`） | 値 / `columns`: **C**（表示順） / `filters`: **C**（`booleanFilter` の番号が並び順を指す）                                 |
| `fieldSet`           | `FieldSetJsonDiff`             | **D**（キー: `fullName`） | 値 / `displayedFields`: **C**（表示順）                                                                                    |
| `compactLayout`      | `CompactLayoutJsonDiff`        | **D**（キー: `fullName`） | `label`: 値 / `fields`: **C**（表示順）                                                                                    |
| `webLink`            | `WebLinkJsonDiff`              | **D**（キー: `fullName`） | 値                                                                                                                         |
| `error`              | `ErrorJsonDiff`（Apex と共通） | **B**（キーを持たない）   | -                                                                                                                          |

- 名前が変われば別物（`removed` + `added`）。
- 読めなかったファイル（`ErrorJson`）は、追加・削除された要素の `kind` に `error` として出る（リストの kind ではなく要素自身の kind）。
- **両方にないものは出さない。** 値（`label`、`precision` など）も子の配列も、before / after のどちらにもなければ、差分のプロパティごと持たない（`PresentDiff` / `makePresentDiff`、[processor/commons/diff/present.ts](../src/analyzer/processor/commons/diff/present.ts)）。
- **片方にだけあるものは `added` / `removed`。** 値なら `{ status, value }`。子の配列（フォルダごと追加・削除された入力規則など）は配列ごと `added` / `removed` にし、`value` の各要素は `{ kind, sourceKeys, value }`（kind / sourceKeys を中身から分ける）にする。両方にあれば中の差分（子の配列なら名前での対応付け）。

## 3. 表示用データ（viewer / MCP）

[view.ts](../src/analyzer/processor/Metadata/view.ts) で、解析（analysis）と Diff を組み合わせて viewer に渡す形にする。status は Diff と同じ語彙（`added` / `removed` / `changed` / `unchanged`）。差分なしのレポートでは status を持たない。

| 型               | 内容                                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ObjectView`     | `apiName`、`objectType`、`label`、`fields`（`FieldView[]`）、`status`（`ObjectUnitDiff` の status）                                                                     |
| `FieldView`      | `apiName`、`origin`（`metadata` / `implicit`）、`valueType`、`fieldType`、`referenceTo`、`relationType`、`status`（API 名で対応付け、objectKey が同じなら `unchanged`） |
| `DependencyView` | 参照関係（`ObjectDependency`）と `status`（参照元の項目と参照先で対応付け、Lookup / MasterDetail が変われば `changed`）                                                 |

`MetadataProcessor`（[metadata.ts](../src/analyzer/processor/Metadata/metadata.ts)）は、保存した前回の解析結果（before）と、リポジトリの今のオブジェクト（after）を読み、`getObjectViews` / `getDependencyViews`（`isDiff`、`targets`、`depth`）で表示用データを返す。`save` で今の結果を次の基準として保存する。

## 4. 動作検証

[examples/metadata/](./examples/metadata/README.md) の before / after を `run-diff.ts` で比べ、`diff-output/` に出す。期待どおりかはテスト test/processor/metadata-diff.test.ts で確かめる。
