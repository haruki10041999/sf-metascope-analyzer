# 共通部品（Apex / Metadata / LWC）

Apex・オブジェクト（Metadata）で使っている型と関数のうち、言語やメタデータの種類に依らないものを `commons` にまとめた。これから実装する LWC も、同じ部品の上に作る。

## 1. 置き場所

| 層         | 場所                                                                    | 中身     |
| ---------- | ----------------------------------------------------------------------- | -------- |
| 型（JSON） | [types/commons/](../src/analyzer/types/commons/)                        | 下の 2.1 |
| parser     | [parser/commons.ts](../src/analyzer/parser/commons.ts)                  | 下の 2.2 |
| processor  | [processor/commons/](../src/analyzer/processor/commons/)                | 下の 2.3 |
| worker     | [worker/](../src/analyzer/worker/) の `workerTask.ts`・`batchWorker.ts` | 下の 2.4 |

- **共通側は Apex / Metadata 側に依存しない。** 依存の向きは「Apex / Metadata / LWC → commons」だけにする。Apex の IR（`apex_IR`）や GumTree など、Apex にしかないものは Apex 側に残す。
- 公開は各層の `index.ts` から行い、Apex / Metadata 側から共通部品を再エクスポートしない。

## 2. 中身

### 2.1 型（`types/commons/`）

| ファイル       | 主なもの                                                                                                                                                                                         | 内容                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `converter.ts` | `SourceInfo`、`CommonType`、`isCommonType`、`ErrorType`、`ConvertErrorCode`、`ValueRuleValue`                                                                                                    | converter（IR → CommonType）の出力の共通の型。Apex（`types/apex/converter`）と LWC（`types/lwc/converter`）で共通。apex_IR / lwc_IR の `ErrorCode` も `ConvertErrorCode` を使う              |
| `json.ts`      | `ConvertKeys`、`JsonType`、`StructureJsonType`、`ErrorJson`、`isErrorJson`、`makeJsonType`、`makeErrorJson`、`makeStructureJson`                                                                 | `kind` / `sourceKeys` を持つ JSON ノードの型                                                                                                                                                 |
| `utils.ts`     | `hash`、`isRecord`                                                                                                                                                                               | objectKey / sourceKey のハッシュ（16 桁）                                                                                                                                                    |
| `source.ts`    | `SourcePosition`、`SourceSpan`                                                                                                                                                                   | ソース位置（行は 1 始まり、列は 0 始まり、end は範囲の次）                                                                                                                                   |
| `xml.ts`       | `parseXml`、`XmlElement`、`XmlSyntaxError`、`childOf`、`childrenOf`                                                                                                                              | 要素ごとの位置付きの XML の木（`*-meta.xml` 用）                                                                                                                                             |
| `xmlJson.ts`   | `makeXmlJson`、`makeXmlErrorJson`、`XmlSourceRegistry`、`XmlSourceJson`、`findXmlSourceInfo`、`readProperties`、`readText(s)`、`nonEmptyEntry`、`ParsedXmlFile`、`XmlReadProblem`、`readXmlRoot` | XML から kind / sourceKeys 付きの JSON を作る部品。ファイルにない要素はプロパティごと持たない。`readXmlRoot` はルート要素を確かめ、読めなければ `ErrorJson` と理由（`XmlReadProblem`）を返す |

### 2.2 parser（`parser/commons.ts`）

| 主なもの                                                                                      | 内容                                                                                            |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `SaveDataInfo`、`makeMsgPackSaveData`、`makeJsonSaveData`、`readMsgPack`、`writeSaveDataInfo` | 解析結果の保存（本番は msgpack、確認用は JSON）と読み込み                                       |
| `readSource`                                                                                  | ソースを読み、改行を LF にそろえる（CRLF / LF で sourceKey が変わらないように）                 |
| `readXmlFile`                                                                                 | XML ファイルを読む（改行をそろえ、構文エラーは位置付きで返す）                                  |
| `XmlResolvedError`、`toXmlResolvedError`                                                      | 読めなかった XML の resolvedError（Apex の resolvedError と同じ形にファイルのパスを足したもの） |

### 2.3 processor（`processor/commons/`）

| ファイル          | 主なもの                                                                                                                                                                                                                               | 内容                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `source.ts`       | `makeConvertKeys`、`findNodeSourceInfo`、`SourceObject`、`getSourceDistance`、`compareSourceDistance`、`findNearestIndex`                                                                                                              | ノードのキーとソース位置、位置の距離（対応付けの推定に使う）                                                                           |
| `diff/commons.ts` | `NodeDiff`、`ValueDiff`、`ReplacementDiff`、`OptionalDiff`、`ErrorJsonDiff`、`SourceKeysDiff`、`ListItemDiff`、`makeNodeDiff`、`makeSetDiff` / `makeSequenceDiff` / `makeKeyedDiff`、`pairAsSet` / `pairAsSequence` / `pairByKey` など | Diff の基本（分類 A〜D、status、match、kind / sourceKeys と中身の分離）。方針は [apex-json-diff-policy.md](./apex-json-diff-policy.md) |
| `diff/list.ts`    | `TypedListItemDiff`、`TypedListDiff`、`TypedObjectDiff`、`makeTypedObjectDiff`、`makeTypedListDiff`、`makeUnchangedItem` / `makeSingleItem` / `makePairedItem`、`MovedFrom`                                                            | 配列の要素の差分（要素の差分に `match` / `index` を足した 1 段の形）                                                                   |
| `diff/present.ts` | `PresentDiff`、`makePresentDiff`、`presentEntry`、`PropertiesDiff`、`makePropertiesDiff`、`makeOrderedValuesDiff`、`makeUnorderedValuesDiff`                                                                                           | ファイルにないことがある値の差分（両方になければ出さない、片方だけなら added / removed）                                               |
| `diff/unit.ts`    | `IdParseResult`、`IdUnitDiff`、`ContentMaker`、`makeIdUnitDiffs`                                                                                                                                                                       | 解析の単位 (フォルダ・バンドル) を id で対応付ける差分。メタデータ (オブジェクト・翻訳) と LWC (バンドル) で共通                       |
| `diff/gumtree/`   | `GumTreeLanguage`、`makeGumTreeBuilder`、`matchTrees`、`makeGumTreeDiff`                                                                                                                                                               | GumTree (木の対応付け)。言語ごとの違い (ラベルの付け方など) は `GumTreeLanguage` で渡す                                                |
| `diff/change.ts`  | `hasChange`                                                                                                                                                                                                                            | 差分の木に unchanged 以外があるか                                                                                                      |

GumTree の本体（木の作り方・対応付け・差分への変換）は `processor/commons/diff/gumtree/` で共通にし、Apex のラベルの付け方（`APEX_GUMTREE_LANGUAGE`）と、それを使う `makeTypedArrayDiff` は Apex 側（`processor/Apex/diff/gumtree/tree.ts`、`typed.ts`）に置く。LWC の Diff での共通化は [lwc-diff-policy.md](./lwc-diff-policy.md)。

### 2.4 worker

| 主なもの                                                                | 内容                                                                                                                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkerTask`（`command` × `type`）、`WorkerTaskResult`、`runWorkerTask` | 解析・保存・読み込みのタスク。`type`（`'Apex'` / `'Object'`）で parser を切り替える。worker_threads でも同じタスクを動かす                                            |
| `BatchWorker`                                                           | プール・一括処理・保存済み ID の一覧などの共通部分。`ApexWorker`・`ObjectWorker`・`ObjectTranslationWorker`・`LwcWorker` はこれを継承し、`parseAndSaveAll` だけを持つ |

## 3. Apex の -meta.xml

クラス・トリガーのメタデータ（`<名前>.cls-meta.xml` / `<名前>.trigger-meta.xml`）も、共通部品で解析と差分ができる。

| 層     | 場所                                                                                                                           | 内容                                                                                                                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 型     | [types/apex/meta.ts](../src/analyzer/types/apex/meta.ts)                                                                       | `ApexClassMetaJson`（kind `apexClassMeta`、ルート `ApexClass`）、`ApexTriggerMetaJson`（kind `apexTriggerMeta`、ルート `ApexTrigger`）。`apiVersion`（`61.0` のような値なので文字列のまま）、`status`、`packageVersions`（`{ namespace, majorNumber, minorNumber }[]`） |
| parser | `ApexParser.parseApexUnit` / `parseApexUnits`、`searchApexUnits`（フォルダごとに、ソースと -meta.xml を 1 つの単位にまとめる） | 解析結果は `ApexUnitParseResult`（単位 = クラス・トリガー・匿名 Apex。`result.base` の `source` / `meta` にそれぞれの JSON）。読めない -meta.xml は `meta.meta` が `ErrorJson`                                                                                          |
| diff   | [processor/Apex/diff/meta.ts](../src/analyzer/processor/Apex/diff/meta.ts)                                                     | `ApexClassMetaJsonDiff` / `ApexTriggerMetaJsonDiff`。値は `PropertiesDiff`、`packageVersions` は namespace で対応付ける（D）                                                                                                                                            |
| 単位   | `makeApexUnitDiffs`                                                                                                            | 単位の id（`class_<名前>` など）で対応付け（`makeIdUnitDiffs`）、`content.fields.meta` に上の差分を入れる                                                                                                                                                               |

サンプルは [examples/apex/](./examples/apex/README.md) に -meta.xml を足した（API バージョンの変更、トリガーの無効化とパッケージの追加、XML の構文エラー、追加・削除）。テストは test/parser/apex-meta.test.ts。

- -meta.xml の `<status>` は、差分の `status`（unchanged / changed …）と同じ名前になる。差分の木をたどるときは、`status` が差分の語彙のときだけ差分のノードとみなし、ノードの `value`（元の JSON）には入らないこと。

## 4. LWC を足すとき

1. **型**: `types/lwc/` に kind ごとの `*Json` を作る。`js-meta.xml`（`LightningComponentBundle`）は `xmlJson.ts` の `readXmlRoot` / `readProperties` / `makeXmlJson` で作れる。JS / HTML は別の解析器になるが、出力は `JsonType`（`kind` / `sourceKeys`）にそろえる。
2. **parser**: `parser/LWC/` に `LwcParser` を作る。ファイルの読み込みは `readSource` / `readXmlFile`、保存は `makeMsgPackSaveData` / `readMsgPack` を使う。解析結果は FileStructureType と同じ形（`filePath`、`resolvedError`、`dataType`、`result.{ id, base, sourceObject }`）にする。
3. **diff**: `processor/LWC/diff/` に `*JsonDiff` を作る。部品は `processor/commons/diff/` のもの（`makeNodeDiff`・`makeKeyedDiff`・`makePresentDiff` など）を使う。
4. **worker**: `WorkerTaskType` に `'Lwc'` を足し、`workerTask.ts` の `handlers` に解析・保存・読み込みを足して、`BatchWorker<'Lwc'>` を継承した `LwcWorker` を作る（実装済み）。

## 5. 名前の変更（この整理で変えたもの）

| 以前                                                                                                                                                                                     | 今                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/apex/commons/json.ts`・`utils.ts`                                                                                                                                                 | `types/commons/json.ts`・`utils.ts`                                                                                                                  |
| `types/metadata/xml.ts`                                                                                                                                                                  | `types/commons/xml.ts`                                                                                                                               |
| `types/metadata/commons.ts`（`makeMetadataJson`、`MetadataSourceRegistry`、`MetadataSourceJson`、`MetadataFile`、`findMetadataSourceInfo`、`ParsedMetadataFile`、`MetadataReadProblem`） | `types/commons/xmlJson.ts`（`makeXmlJson`、`XmlSourceRegistry`、`XmlSourceJson`、`XmlFile`、`findXmlSourceInfo`、`ParsedXmlFile`、`XmlReadProblem`） |
| `MetadataResolvedError`                                                                                                                                                                  | `XmlResolvedError`（`parser/commons.ts`）                                                                                                            |
| `processor/Apex/diff/commons.ts`                                                                                                                                                         | `processor/commons/diff/commons.ts`                                                                                                                  |
| `processor/Apex/diff/typed.ts` の GumTree に依存しない部分、`gumtree/diff.ts` の `MovedFrom`                                                                                             | `processor/commons/diff/list.ts`                                                                                                                     |
| `processor/Metadata/diff/commons.ts`                                                                                                                                                     | `processor/commons/diff/present.ts`                                                                                                                  |
| `processor/Apex/diff/unitBody.ts` の `hasChange`                                                                                                                                         | `processor/commons/diff/change.ts`                                                                                                                   |
| `processor/Apex/commons.ts` の `makeConvertKeys`・`findSourceInfo`・距離の関数                                                                                                           | `processor/commons/source.ts`（`findSourceInfo` は `findNodeSourceInfo` に改名。`types/apex` の同名の別関数と区別するため）                          |
| `apex_IR` の `SourcePosition` / `SourceSpan`                                                                                                                                             | `types/commons/source.ts`                                                                                                                            |
| `types/apex/converter/commons.ts` の `SourceInfo`・`CommonType`・`isCommonType`・`ErrorType`・`ValueRuleValue`                                                                           | `types/commons/converter.ts`（Apex だけの `makeSourceInfo`・`makeErrorType` は元の場所に残す）                                                       |
| `worker/apexTask.ts`（`ApexTask`、`runApexTask`）、`apexThread.ts`                                                                                                                       | `worker/workerTask.ts`（`WorkerTask`、`runWorkerTask`）、`workerThread.ts`、`batchWorker.ts`、`objectWorker.ts`                                      |
| `query/clauses.ts`（再エクスポートだけのファイル）                                                                                                                                       | 削除                                                                                                                                                 |
