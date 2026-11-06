# 共通部品（Apex / LWC / メタデータ）

Apex・LWC・オブジェクト（メタデータ）で使っている型と関数のうち、言語やメタデータの種類に依らないものを `commons` にまとめた。

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

## 3. 新しい種類を足すとき

[metadata-roadmap.md](./metadata-roadmap.md) の未対応のメタデータ（Flow・権限など）を足すときの手順。LWC・オブジェクトの翻訳もこの手順で作った。

1. **型**（`types/<種類>/`）: kind ごとの `*Json` と `make*Json`。XML は `xmlJson.ts` の `readXmlRoot` / `readProperties` / `makeXmlJson` で作る（中間表現は作らない）。XML 以外で位置の範囲を持つ木（HTML・CSS など）は `spanJson.ts` の `makeSpanJson`。出力は `JsonType` / `StructureJsonType`（`kind` / `sourceKeys`）にそろえる。
2. **parser**（`parser/<種類>/`）: Apex・LWC と同じく、フォルダの読み込み（`folder.ts`）と、読んだ中身の解析（ファイルシステムに触らない）を分け、入口のクラスは「探す・読む・保存・保存済みの読み込み」だけを持つ。解析結果は `{ filePath, resolvedError, dataType, result: { id, base, sourceObject } }`。1 単位 = 1 解析結果 = 1 保存ファイル（`makeMsgPackSaveData` / `readMsgPack`。保存名は種類の接頭辞を付ける）。
3. **diff**（`processor/<種類>/diff/`）: 単位は `makeIdUnitDiffs`、中は `processor/commons/diff/` の部品（`makeNodeDiff`・`makeKeyedDiff`・`makePresentDiff` など）。木の対応付けが要るときは `GumTreeLanguage` を書く。
4. **worker**: `WorkerTaskType`・`SaveDataType` に種類を足し、`workerTask.ts` の `handlers` に解析・保存・読み込みを足して、`BatchWorker` を継承した worker を作る。保存名の接頭辞は、オブジェクトの `readSavedObjects` が除く一覧にも足す。
5. **サンプル**: `docs/examples/<種類>/`（`samples/`・`scripts/`・`output/`）と、Diff のテスト。
