# オブジェクト（Metadata）の実装まとめ

Salesforce のオブジェクトのメタデータ（`force-app/main/default/objects/<API 名>/` の `*-meta.xml`）を読み、解析し、前回との差分を取る実装の全体像をまとめる。Apex と同じ流れ（読み取り → `kind` / `sourceKeys` 付き JSON → 解析 → Diff）で作っている。

詳しい方針は次の 2 つにある。この文書は、どこに何があり、どうつながっているかの案内にする。

- JSON の型・parse・解析: [metadata-json-reference.md](./metadata-json-reference.md)
- オブジェクトの翻訳（objectTranslation）: [object-translation.md](./object-translation.md)（解析結果・保存はオブジェクトと分ける）
- Diff の方針: [metadata-diff-policy.md](./metadata-diff-policy.md)（分類・status・出力の形は [apex-json-diff-policy.md](./apex-json-diff-policy.md) と同じ）

## 1. 処理の流れ

```text
objects/<API 名>/*.xml
   │  MetadataParser.parseObject（parser/Metadata）
   │    parseXml（位置付きの XML の木）→ make*Json（kind / sourceKeys 付き JSON）
   ▼
ObjectParseResult（Apex と同じ FileStructureType の形。msgpack で保存）
   │
   ├─ analysis（1 つの時点）: analyzeObject / getObjectDependencies / getRelatedObjectApiNames
   │
   └─ diff（2 つの時点）: makeObjectUnitDiffs → ObjectUnitDiff[]（中身は CustomObjectJsonDiff）
   ▼
view（analysis + diff）: ObjectView / DependencyView
   ▼
MetadataProcessor → MCP の analyze_objects → viewer（レポート HTML）
```

- **before** は前回保存した解析結果（`<保存先>/objects/<API 名>.msgpack`）、**after** はリポジトリの今のオブジェクト。
- 解析は Diff に依存せず、1 つの時点の JSON だけを入力にする。両方を組み合わせるのは `view.ts` だけ。

## 2. ファイル構成

| 層              | ファイル                                                                                                                                                                            | 役割                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XML の読み取り  | [types/commons/xml.ts](../src/analyzer/types/commons/xml.ts)                                                                                                                        | `parseXml`。要素ごとに開始・終了位置（offset / 行 / 列）を持つ木（`XmlElement`）を作る。構文エラーは `XmlSyntaxError`（位置付き）                                                   |
| JSON の共通部品 | [types/commons/xmlJson.ts](../src/analyzer/types/commons/xmlJson.ts)                                                                                                                | `makeXmlJson`（kind / sourceKeys の付与とソース位置の登録）、`makeXmlErrorJson`、`XmlSourceRegistry`、`findXmlSourceInfo`、子要素を読む `readProperties` / `readText` / `readTexts` |
| JSON の型       | [types/metadata/](../src/analyzer/types/metadata/) の `object.ts`・`field.ts`・`validationRule.ts`・`recordType.ts`・`listView.ts`・`fieldSet.ts`・`compactLayout.ts`・`webLink.ts` | kind ごとの `*Json` 型、`make*Json`、値のスキーマ（`*_SCHEMA`）。`object.ts` には子の種類の対応表 `OBJECT_MEMBERS` と、フォルダ全体をまとめる `makeCustomObjectJson` がある         |
| parse           | [parser/Metadata/parser.ts](../src/analyzer/parser/Metadata/parser.ts)                                                                                                              | `MetadataParser`。フォルダを探し、ファイルを読み、`ObjectParseResult` にする。msgpack / JSON での保存と読み込み                                                                     |
| analysis        | [processor/Metadata/analysis.ts](../src/analyzer/processor/Metadata/analysis.ts)                                                                                                    | 項目の値の型、暗黙の標準項目、参照関係、関連オブジェクト                                                                                                                            |
| diff            | [processor/Metadata/diff/](../src/analyzer/processor/Metadata/diff/)                                                                                                                | kind ごとの `*JsonDiff` と `make*Diff`（types と同じファイル分け）、オブジェクト単位の `unit.ts`、共通部品 `commons.ts`                                                             |
| 表示用データ    | [processor/Metadata/view.ts](../src/analyzer/processor/Metadata/view.ts)                                                                                                            | viewer に渡す `ObjectView` / `FieldView` / `DependencyView`                                                                                                                         |
| まとめ役        | [processor/Metadata/metadata.ts](../src/analyzer/processor/Metadata/metadata.ts)                                                                                                    | `MetadataProcessor`。before / after を読み、差分と表示用データを返す。MCP サーバーから使う                                                                                          |

すべて `src/analyzer/index.ts` から公開している（`types` / `parser` / `processor` の各 `index.ts` 経由）。

## 3. parse

### 3.1 読む範囲

1 つのオブジェクト（フォルダ）を `CustomObjectJson` 1 つにまとめる。子は 7 種類。

| 子の配列          | フォルダ / 接尾辞                           | ルート要素       | kind                                            |
| ----------------- | ------------------------------------------- | ---------------- | ----------------------------------------------- |
| `fields`          | `fields/*.field-meta.xml`                   | `CustomField`    | `field`（選択リスト値は `picklistValue`）       |
| `validationRules` | `validationRules/*.validationRule-meta.xml` | `ValidationRule` | `validationRule`                                |
| `recordTypes`     | `recordTypes/*.recordType-meta.xml`         | `RecordType`     | `recordType`（使える値は `recordTypePicklist`） |
| `listViews`       | `listViews/*.listView-meta.xml`             | `ListView`       | `listView`                                      |
| `fieldSets`       | `fieldSets/*.fieldSet-meta.xml`             | `FieldSet`       | `fieldSet`                                      |
| `compactLayouts`  | `compactLayouts/*.compactLayout-meta.xml`   | `CompactLayout`  | `compactLayout`                                 |
| `webLinks`        | `webLinks/*.webLink-meta.xml`               | `WebLink`        | `webLink`                                       |

- `<API 名>.object-meta.xml`（`CustomObject`）から、オブジェクト自身の値（`label`、`sharingModel` など）と `nameField` を読む。ないとき（標準オブジェクトなど）は、子のファイルだけから作る。
- メタデータ API の形式（`<CustomObject>` の中に `<fields>` などを書く）も読む。子の並びは、object-meta.xml の中のもののあとに、ファイル名の順。
- プロパティ名は XML の要素名と同じ。真偽値・数値は `boolean` / `number` にする。フォルダにもファイルにもないもの（値の要素、子のフォルダ、空のリスト）はプロパティごと持たない。
- 種類を増やすときは、`types/metadata/` に型と `make*Json` を足し、`OBJECT_MEMBERS` に 1 行足す（parser は表を見てフォルダを読む）。

### 3.2 キーとソース位置

| キー        | 計算元                                                      | 変わる条件               |
| ----------- | ----------------------------------------------------------- | ------------------------ |
| `objectKey` | `${kind}_${hash(内容)}`（子孫の `sourceKeys` を除いた内容） | 内容が変わったとき       |
| `sourceKey` | `${kind}_${hash({ filePath, start, end })}`                 | 内容か位置が変わったとき |

- 改行コードは LF にそろえてから読む（Apex と同じ）。エディタの保存で CRLF になっても sourceKey は変わらない。
- ソース位置（`sourceObject`）は Apex の `SourceJson` の各要素に `filePath`（オブジェクトのフォルダの親からの相対パス）を足した形。1 つのオブジェクトが複数のファイルからなるため。`findXmlSourceInfo(sourceObject, sourceKeys)` で、ファイル・行・列・元の XML を引ける。

### 3.3 読めなかったファイル

| 場合                             | 結果                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| 子のファイルの XML の構文エラー  | その配列に `ErrorJson`（`kindType` は読もうとした kind）。`resolvedError` に `XML_SYNTAX` |
| 子のファイルのルート要素の間違い | 同上。`UNEXPECTED_ROOT`                                                                   |
| object-meta.xml 自体が読めない   | オブジェクト全体が `dataType: 'error'`（`base` が `ErrorJson`）                           |

### 3.4 主な API（`MetadataParser`）

| メソッド                                                    | 内容                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `parseObject(objectDir)`                                    | フォルダ 1 つを読む                                                                                          |
| `parseObjects(rootDir)`                                     | `objects` フォルダ（またはその上）の下のすべてのオブジェクトを読む。`objects` そのものを渡すと直下だけを見る |
| `searchObjectDirectories(rootDir)`                          | オブジェクトのフォルダの一覧                                                                                 |
| `saveObjectFile` / `readObjectMsgPack` / `readSavedObjects` | msgpack（Apex と同じ設定）での保存と読み込み                                                                 |
| `saveObjectFileForDevelopper`                               | 確認用の JSON                                                                                                |

```ts
const result = await MetadataParser.parseObject('force-app/main/default/objects/Invoice__c');
if (result.dataType === 'object') {
    result.result.base.fields; // (CustomFieldJson | ErrorJson)[]
}
```

## 4. analysis

| 関数                                                     | 内容                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analyzeObject(object)`                                  | `ObjectInfo`（項目の一覧 `ObjectFieldInfo[]`）。暗黙の標準項目（`Id`、`Name`、`CreatedDate`、`CreatedById` → User、`LastModifiedDate`、`LastModifiedById` → User、カスタムメタデータ型以外は `SystemModstamp` / `IsDeleted`）のあとに、メタデータの項目を API 名の順で並べる。読めなかった項目は除く |
| `getFieldValueType(field)`                               | Salesforce の型を値の型（`FieldValueType`）にまとめる。Checkbox → `Boolean`、Number / Currency / Percent → `scale` が 0 なら `Integer`・それ以外は `Double`、Lookup / MasterDetail → `Reference` など                                                                                                |
| `getObjectDependencies(objects)`                         | 参照関係 `ObjectDependency`（参照元のオブジェクト・項目 → 参照先、Lookup / MasterDetail）                                                                                                                                                                                                            |
| `getRelatedObjectApiNames(dependencies, targets, depth)` | targets から参照元 → 参照先の向きに depth 段たどったオブジェクト（depth 1 は targets だけ）                                                                                                                                                                                                          |

## 5. diff

### 5.1 オブジェクト単位（`makeObjectUnitDiffs`）

- オブジェクトは API 名で対応付ける。片方にしかなければ `added` / `removed`。
- `ObjectUnitDiff` は `id`、`status`、`filePath`、`dataType`、`resolvedError`（読めなかったファイルの集合）、`content`（`CustomObjectJsonDiff`、どちらも読めなかったときは `ErrorJsonDiff`）を持つ。
- 中身か `resolvedError` に変化があれば `changed`。位置だけの変化は `unchanged`。

### 5.2 kind ごと

| kind                                                                                                  | Diff の型                    | 対応付け                                                              |
| ----------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `object`                                                                                              | `CustomObjectJsonDiff`       | 子の 7 種類はどれも名前で対応付ける（D）。読めなかった要素は集合（B） |
| `field`                                                                                               | `CustomFieldJsonDiff`        | `apiName`                                                             |
| `picklistValue`                                                                                       | `PicklistValueJsonDiff`      | `fullName`（並び順の変化は報告しない）                                |
| `validationRule` / `recordType` / `listView` / `fieldSet` / `compactLayout` / `webLink`               | `*JsonDiff`                  | `fullName`                                                            |
| `recordTypePicklist`                                                                                  | `RecordTypePicklistJsonDiff` | `picklist`（中の `values` は集合 B）                                  |
| リストビューの `columns` / `filters`、項目セットの `displayedFields`、コンパクトレイアウトの `fields` | `TypedListDiff`              | 並び順に意味があるので順序付き列（C）。並べ替えは `moved`             |

- 両方にない値・子の配列は差分に出さない。片方にだけあるものは `added` / `removed`（子の配列はフォルダごと、配列ごとに `added` / `removed`。要素は `{ kind, sourceKeys, value }`）。値の差分はスキーマから作る `PropertiesDiff`、任意項目は `PresentDiff` / `makePresentDiff`（[processor/commons/diff/present.ts](../src/analyzer/processor/commons/diff/present.ts)）。
- 共通部品（`NodeDiff`、`makeKeyedDiff`、`makeTypedListDiff`、`makeSourceKeysDiff` など）は Apex のもの（`processor/Apex/diff/`）を使う。出力の形も Apex と同じ。

### 5.3 出力の例

サンプルの `Invoice__c.Amount__c`（`precision` 18 → 16）。内容が変わったので `objectKey` は `{ before, after }`、位置は同じなので `sourceKey` は単体になる。

```json
{
    "kind": "field",
    "sourceKeys": {
        "objectKey": { "before": "field_cbe5a53d3a461c46", "after": "field_97d666f8088358b3" },
        "sourceKey": "field_6bea3d920a7c150a"
    },
    "status": "changed",
    "match": "key",
    "fields": {
        "apiName": { "status": "unchanged", "value": "Amount__c" },
        "precision": { "status": "changed", "before": 18, "after": 16 },
        "scale": { "status": "unchanged", "value": 2 }
    },
    "index": { "before": 1, "after": 1 }
}
```

## 6. 表示用データと MetadataProcessor

### 6.1 表示用データ（`view.ts`）

| 型               | 内容                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `ObjectView`     | `apiName`、`objectType`、`label`、`fields`（`FieldView[]`）、`status`                                                      |
| `FieldView`      | `apiName`、`origin`（`metadata` / `implicit`）、`valueType`、`fieldType`、`label`、`referenceTo`、`relationType`、`status` |
| `DependencyView` | 参照関係と `status`                                                                                                        |

- `status` は Diff と同じ語彙（`added` / `removed` / `changed` / `unchanged`）。差分なしのレポートでは持たない。
- オブジェクトの status は `ObjectUnitDiff` から、項目は API 名で対応付けて objectKey で判定する。参照関係は「参照元の項目 → 参照先」で対応付け、Lookup / MasterDetail が変われば `changed`。

### 6.2 MetadataProcessor

```ts
const processor = await MetadataProcessor.create(saveRoot, repositoryRoot);
if (!(await processor.hasSavedObjects())) await processor.save(); // 初回は今の状態を基準にする

processor.getObjectViews({ isDiff: true }); // 前回からの差分
processor.getObjectViews({ isDiff: false, targets: ['Payment__c'], depth: 2 }); // 関連するものに絞る
processor.getDependencyViews({ isDiff: true });
processor.getObjectUnitDiffs(); // 差分の生データ
await processor.save(); // 今の結果を次の基準にする
```

| メソッド                                                                | 内容                                                                                                             |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `create` / `reset`                                                      | before（保存データ）と after（`<リポジトリ>/force-app/main/default/objects`）を読み、差分を作る                  |
| `hasSavedObjects`                                                       | 保存データがあるか                                                                                               |
| `save`                                                                  | after を `<保存先>/objects/` に msgpack で保存し（リポジトリにないオブジェクトの保存データは消す）、`reset` する |
| `getObjectViews` / `getDependencyViews`                                 | 表示用データ。`targets` を指定すると、そこから depth 段たどったオブジェクトと、そこから出る参照関係に絞る        |
| `getObjectUnitDiffs` / `getBeforeParseResults` / `getAfterParseResults` | 差分と parse 結果                                                                                                |

## 7. 利用側（MCP サーバー・viewer）

| 対象                                                                                                             | 内容                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mcp/server.ts](../src/mcp/server.ts)                                                                            | `save_objects` / `analyze_objects` のツール名と入力は変えていない。中で `MetadataProcessor` の `save` / `getObjectViews` / `getDependencyViews` を呼ぶ。初回保存の判定は `hasSavedObjects()` |
| [viewer/types/](../src/viewer/types/)                                                                            | `ObjectView` / `DependencyView` を受け取る（`MetadataProp`）                                                                                                                                 |
| [viewer/metadata/node.tsx](../src/viewer/metadata/node.tsx)、[metadata.css](../src/viewer/metadata/metadata.css) | 状態のバッジを `added` / `removed` / `changed` / `unchanged` にした（`changed` の色を追加）。項目の型の欄は、参照先 → Salesforce の型 → 値の型 の順で表示する                                |

以前の実装から削除したもの: `types/metadata.ts`（`MetadataObject` / `MetadataObjectDiff` などの旧型と、status `New` / `Exist` / `Delete`）、`types/commons.ts`、`parser/metadata.ts`、`processor/Metadata/dependency.ts`（`MetadataProcessor` に統合）。

## 8. 動作検証とテスト

[examples/metadata/](./examples/metadata/README.md) に sfdx 形式の before / after（7 オブジェクト）を置いている。サンプルの中身と期待する差分は README を参照。

```sh
npx ttsx --noCheck docs/examples/metadata/scripts/run-parse.ts   # output/json/: JSON と要約
npx ttsx --noCheck docs/examples/metadata/scripts/run-diff.ts    # output/diff/: 差分・summary・coverage・viewer 用データ
```

| テスト                               | 内容                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| test/parser/metadata-parse.test.ts   | XML の位置・実体参照・構文エラー、object の読み込み、メタデータ API の形式、読めなかったファイル、キー（位置だけの変化・CRLF）、msgpack の保存と読み込み、analysis |
| test/processor/metadata-diff.test.ts | サンプルの差分（すべての kind が差分に現れること、名前での対応付け、順序付きの列・集合、エラー）、表示用データ、`MetadataProcessor` の保存 → 再読込 → 差分         |

## 9. 未対応・既知の問題

- **レポート HTML にデータが入らない（既存の不具合）**: `htmlBuilder` は Vite の `define` に `__METASCOPE_METADATA_DEFINE__` を渡すが、`main.tsx` は `window.__METASCOPE_METADATA_DEFINE__` を読み、`index.html` は `__METASCOPE_METADATA_PLACEHOLDER__` を使っていて、名前が食い違っている。ビルドは通るが表示されるデータが空になる。
- 読むのは 7 種類の子だけ。ビジネスプロセス、検索レイアウト、共有の理由、項目の参照の絞り込み条件（`lookupFilter`）などは読まない（読まない子要素は無視する）。
- 名前が変わったもの（項目のリネームなど）は `removed` + `added` になる（リネームの推定はしない。Apex と同じ）。
- 選択リスト値の並び順の変化は報告しない（名前で対応付けるため）。
- 暗黙の標準項目は固定の一覧で、オブジェクトごとの違い（`OwnerId` の有無など）は見ていない。
