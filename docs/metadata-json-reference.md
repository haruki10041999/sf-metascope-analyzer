# オブジェクトのメタデータ JSON（parse・analysis）

Salesforce のオブジェクトのメタデータ（`force-app/main/default/objects/<API 名>/` の `*-meta.xml`）を、Apex と同じ形の JSON（`kind` / `sourceKeys` を持つ JsonType）にする方針と、その JSON の型をまとめる。Diff は [metadata-diff-policy.md](./metadata-diff-policy.md)。

## 1. 全体の構成

Apex の構成（IR → JSON → 解析・Diff）にそろえる。

| 層                                                                | 置き場所                                                                                                                                    | Apex で対応するもの                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| XML の読み取り（要素ごとのソース位置付きの木）                    | [types/commons/xml.ts](../src/analyzer/types/commons/xml.ts)                                                                                | `types/apex_IR`                       |
| JSON の型と生成（`make*Json`）                                    | [types/metadata/](../src/analyzer/types/metadata/)                                                                                          | `types/apex`                          |
| ファイルを読み、オブジェクト単位の結果（FileStructureType）にする | [parser/Metadata/parser.ts](../src/analyzer/parser/Metadata/parser.ts) の `MetadataParser`                                                  | `ApexParser`                          |
| 解析（1 つの時点の JSON から情報を取り出す）                      | [processor/Metadata/analysis.ts](../src/analyzer/processor/Metadata/analysis.ts)                                                            | `processor/Apex/analysis`（方針のみ） |
| Diff                                                              | [processor/Metadata/diff/](../src/analyzer/processor/Metadata/diff/)                                                                        | `processor/Apex/diff`                 |
| 表示用データ（解析 + Diff）と MCP 向けのまとめ役                  | [view.ts](../src/analyzer/processor/Metadata/view.ts)、[metadata.ts](../src/analyzer/processor/Metadata/metadata.ts) の `MetadataProcessor` | -                                     |

- XML は fast-xml-parser ではなく自前で読む。sourceKey を作るのに要素ごとの位置（行・列・offset）が要るため。扱うのは Salesforce のメタデータで使う範囲（要素・属性・テキスト・実体参照・コメント・CDATA・XML 宣言）だけ。
- 改行コードは LF にそろえてから読む（Apex と同じ。CRLF / LF で sourceKey が変わらないように）。

## 2. 単位とキー

- **単位はオブジェクト（フォルダ）**。`<API 名>.object-meta.xml` と、フォルダの中の `fields/` `validationRules/` などのファイルを 1 つの `CustomObjectJson` にまとめる。オブジェクトのファイルがない（標準オブジェクトなど）ときは、項目などのファイルだけから作る。
- メタデータ API の形式（`<CustomObject>` の中に `<fields>` などを書く）も読む。子の並びは、object-meta.xml の中のもののあとに、ファイル名の順。
- `objectKey` / `sourceKey` の付け方は Apex と同じ。

| キー        | 計算元                                                                            | 変わる条件                                   |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| `objectKey` | `${kind}_${hash(内容)}`。内容は子孫の `sourceKeys` を除いたもの（子の内容を含む） | 内容が変わったとき                           |
| `sourceKey` | `${kind}_${hash({ filePath, start, end })}`                                       | 内容か位置（ファイル・行・列）が変わったとき |

- ソース位置（`sourceObject`）は Apex の `SourceJson` と同じ形で、`source` の各要素に `filePath`（オブジェクトのフォルダの親からの相対パス）を足したもの。`findXmlSourceInfo` で引く。`context` は要素の XML の文字列。

## 3. JSON の型（kind）

プロパティ名は XML の要素名と同じにする。真偽値・数値の要素は `boolean` / `number` にする。

**フォルダにもファイルにもないものは持たない（`?`）。** 値の要素がなければそのプロパティを、子のフォルダ（と object-meta.xml の中の要素）がなければ子の配列（`validationRules` など）を持たない。`valueSet.values`・`picklistValues`・`columns`・`filters`・`displayedFields`・コンパクトレイアウトの `fields` も、要素がなければ持たない（空の配列にしない）。必ず持つのは `kind`・`sourceKeys` と名前（`apiName` / `fullName` / `picklist`）、オブジェクトの `objectType` だけ。

| kind                 | 型                         | 元のファイル                                 | 主なプロパティ                                                                                                                                                                                                                                                                                                   |
| -------------------- | -------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `object`             | `CustomObjectJson`         | `<名前>.object-meta.xml`（`<CustomObject>`） | `apiName`、`objectType`（接尾辞から: `custom` / `customMetadata` / `platformEvent` / `bigObject` / `externalObject` / `standard`）、`label`、`pluralLabel`、`description`、`sharingModel`、`deploymentStatus`、`visibility`、`enable*`、`nameField`（`{ label, type, displayFormat }`）、子の配列（下の 7 種類） |
| `field`              | `CustomFieldJson`          | `fields/*.field-meta.xml`（`<CustomField>`） | `apiName`、`type`（Salesforce の型をそのまま）、`label`、`required`、`unique`、`externalId`、`length`、`precision`、`scale`、`defaultValue`、`formula`、`referenceTo`、`relationshipName`、`deleteConstraint`、`summary*`、`track*`、`valueSet`                                                                  |
| `picklistValue`      | `PicklistValueJson`        | `<valueSet><valueSetDefinition><value>`      | `fullName`、`label`、`default`、`color`、`isActive`                                                                                                                                                                                                                                                              |
| `validationRule`     | `ValidationRuleJson`       | `validationRules/*`（`<ValidationRule>`）    | `fullName`、`active`、`errorConditionFormula`、`errorDisplayField`、`errorMessage`                                                                                                                                                                                                                               |
| `recordType`         | `RecordTypeJson`           | `recordTypes/*`（`<RecordType>`）            | `fullName`、`label`、`active`、`businessProcess`、`picklistValues`                                                                                                                                                                                                                                               |
| `recordTypePicklist` | `RecordTypePicklistJson`   | `<RecordType><picklistValues>`               | `picklist`（項目の API 名）、`values`（`{ fullName, default }[]`）                                                                                                                                                                                                                                               |
| `listView`           | `ListViewJson`             | `listViews/*`（`<ListView>`）                | `fullName`、`label`、`filterScope`、`booleanFilter`、`columns`（表示順）、`filters`（`{ field, operation, value }[]`）                                                                                                                                                                                           |
| `fieldSet`           | `FieldSetJson`             | `fieldSets/*`（`<FieldSet>`）                | `fullName`、`label`、`displayedFields`（表示順）                                                                                                                                                                                                                                                                 |
| `compactLayout`      | `CompactLayoutJson`        | `compactLayouts/*`（`<CompactLayout>`）      | `fullName`、`label`、`fields`（表示順）                                                                                                                                                                                                                                                                          |
| `webLink`            | `WebLinkJson`              | `webLinks/*`（`<WebLink>`）                  | `fullName`、`masterLabel`、`displayType`、`linkType`、`openType`、`url`                                                                                                                                                                                                                                          |
| `error`              | `ErrorJson`（Apex と共通） | 読めなかったファイル                         | `kindType`（何として読もうとしたか: `field` など）                                                                                                                                                                                                                                                               |

- `valueSet`（`ValueSetJson`）は kind を持たない入れ物で、`restricted`、`sorted`、`valueSetName`（グローバル値セット）、`controllingField`、`values`（`PicklistValueJson[]`）を持つ。
- 名前（`fullName`）がないときは、ファイル名から接尾辞を除いたものを使う。

## 4. 読めなかったファイル

| 場合                                                          | JSON                                                                                                   | `resolvedError` の `code` |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- |
| XML の構文エラー                                              | その種類の配列に `ErrorJson`（位置はエラーの位置）                                                     | `XML_SYNTAX`              |
| ルート要素が想定と違う（項目のフォルダに入力規則がある など） | 同上（位置はルート要素）                                                                               | `UNEXPECTED_ROOT`         |
| `<名前>.object-meta.xml` 自体が読めない                       | オブジェクト全体を `dataType: 'error'`（`base` が `ErrorJson`）にする（Apex のユニットのエラーと同じ） | 同上                      |

`resolvedError` は Apex と同じ形（`sourceKeys`、`code`、`contextType`、`context`、`errorMessage`、`start`、`end`）に `filePath` を足したもの。

## 5. 保存の形式

Apex と同じ FileStructureType（`ObjectFileStructureType` / `ErrorObjectFileStructureType`）にし、msgpack（records を使う設定）で `<保存先>/objects/<API 名>.msgpack` に保存する（`MetadataParser.saveObjectFile` / `readObjectMsgPack`）。開発者の確認用に JSON でも書ける（`saveObjectFileForDevelopper`）。

## 6. 解析（analysis）

1 つの時点の `CustomObjectJson` から取り出す。Diff には依存しない。

| 関数                       | 内容                                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analyzeObject`            | 項目の一覧（`ObjectFieldInfo`）。暗黙の標準項目（`Id`、`Name`、`CreatedDate`、`CreatedById` → User など。カスタムメタデータ型は `SystemModstamp` / `IsDeleted` を除く）のあとに、メタデータの項目を API 名の順で並べる |
| `getFieldValueType`        | Salesforce の型を値の型にまとめる（Checkbox → `Boolean`、Number / Currency / Percent → `scale` が 0 なら `Integer`、それ以外は `Double`、Lookup / MasterDetail → `Reference` など）                                    |
| `getObjectDependencies`    | 参照関係（参照元のオブジェクト・項目 → 参照先のオブジェクト、Lookup / MasterDetail）                                                                                                                                   |
| `getRelatedObjectApiNames` | 指定したオブジェクトから参照関係を depth 段たどって届くオブジェクト（参照元 → 参照先の向き）                                                                                                                           |

## 7. 動作検証

[examples/metadata/](./examples/metadata/README.md) の before / after のサンプルを `run-parse.ts` で読み、`parse-output/` に JSON と要約を出す。テストは test/parser/metadata-parse.test.ts。
