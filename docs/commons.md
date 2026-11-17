# 共通部品（Apex / LWC / メタデータ）

Apex・LWC・オブジェクト（メタデータ）で使っている型と関数のうち、言語やメタデータの種類に依らないものを `commons` にまとめた。

## 1. 置き場所

| 層         | 場所                                                                   | 中身     |
| ---------- | ---------------------------------------------------------------------- | -------- |
| 型（JSON） | [types/commons/](../src/analyzer/types/commons/)                       | 下の 2.1 |
| parser     | [parser/commons.ts](../src/analyzer/parser/commons.ts)                 | 下の 2.2 |
| processor  | [processor/commons/](../src/analyzer/processor/commons/)               | 下の 2.3 |
| worker     | [worker/](../src/analyzer/worker/) の `unitWorker.ts`・`workerPool.ts` | 下の 2.4 |
| 単位の種類 | [unit/](../src/analyzer/unit/)                                         | 下の 2.5 |

- **共通側は Apex / Metadata 側に依存しない。** 依存の向きは「Apex / Metadata / LWC → commons」だけにする。Apex の IR（`apex_IR`）や GumTree など、Apex にしかないものは Apex 側に残す。
- 公開は各層の `index.ts` から行い、Apex / Metadata 側から共通部品を再エクスポートしない。

## 2. 中身

### 2.1 型（`types/commons/`）

| ファイル       | 主なもの                                                                                                                                                                     | 内容                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ir.ts`        | `CommonTypeClass`、`TypeField`、`FieldsOf`、`collectSourceObjects`、`IrError`、`IrBuildError`、`recoverIrBuild`、`collectIrErrors`                                           | Apex・LWC の IR の基底クラスと、IR を作れなかったところの扱い（木に残さずリスナーに渡す）。方針は [ir.md](./ir.md)                                                                                                                       |
| `json.ts`      | `ConvertKeys`、`JsonType`、`StructureJsonType`、`makeJsonType`、`makeStructureJson`                                                                                          | `kind` / `sourceKeys` を持つ JSON ノードの型。エラーのノードの型はない（読めなかったものは resolvedError だけに出る）                                                                                                                    |
| `utils.ts`     | `hash`、`isRecord`                                                                                                                                                           | objectKey / sourceKey のハッシュ（16 桁）                                                                                                                                                                                                |
| `source.ts`    | `SourcePosition`、`SourceSpan`                                                                                                                                               | ソース位置（行は 1 始まり、列は 0 始まり、end は範囲の次）                                                                                                                                                                               |
| `xml.ts`       | `parseXml`、`XmlElement`、`XmlSyntaxError`、`childOf`、`childrenOf`                                                                                                          | 要素ごとの位置付きの XML の木（`*-meta.xml` 用）                                                                                                                                                                                         |
| `valueTree.ts` | `toValueTree`、`toValueTreeProperties`、`ValueTreeOptions`                                                                                                                   | 種類ごとに形を決めない要素を、要素名をプロパティ名にした値の木にする。`lists`（1 つでも配列にする要素）・`skip`（読まない要素。名前の一覧か関数）・`valueTypes`（値の要素）で種類ごとの決まりを渡す（Flow は接続と位置を `skip` で外す） |
| `xmlJson.ts`   | `makeXmlJson`、`XmlSourceRegistry`、`XmlSourceJson`、`findXmlSourceInfo`、`readProperties`、`readText(s)`、`nonEmptyEntry`、`ParsedXmlFile`、`XmlReadProblem`、`readXmlRoot` | XML から kind / sourceKeys 付きの JSON を作る部品。ファイルにない要素はプロパティごと持たない。`readXmlRoot` はルート要素を確かめ、読めなければ null を返して理由（`XmlReadProblem`）を `problems` に足す                                |

### 2.2 parser（`parser/commons.ts`）

| 主なもの                                                | 内容                                                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SaveDataInfo`、`makeJsonSaveData`、`writeSaveDataInfo` | 開発者でのデータ確認用の JSON の保存（本番の保存は UnitStore の SQLite。[implementation-roadmap.md](./implementation-roadmap.md) 5 章）                   |
| `SAVE_FORMAT_VERSION`                                   | 置き場所（レイアウト）の版。違えば UnitStore が表を作り直す（解析し直して保存し直す）。JSON の形の版は系統ごと（`unitType.ts` の `UNIT_FORMAT_VERSIONS`） |
| `readSource`                                            | ソースを読み、改行を LF にそろえる（CRLF / LF で sourceKey が変わらないように）                                                                           |
| `readXmlFile`                                           | XML ファイルを読む（改行をそろえ、構文エラーは位置付きで返す）                                                                                            |
| `XmlResolvedError`、`toXmlResolvedError`                | 読めなかった XML の resolvedError（Apex の resolvedError と同じ形にファイルのパスを足したもの）                                                           |

### 2.3 processor（`processor/commons/`）

| ファイル          | 主なもの                                                                                                                                                                                                              | 内容                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `source.ts`       | `makeConvertKeys`、`findNodeSourceInfo`、`SourceObject`、`getSourceDistance`、`compareSourceDistance`、`findNearestIndex`                                                                                             | ノードのキーとソース位置、位置の距離（対応付けの推定に使う）                                                                       |
| `diff/commons.ts` | `NodeDiff`、`ValueDiff`、`ReplacementDiff`、`OptionalDiff`、`SourceKeysDiff`、`ListItemDiff`、`makeNodeDiff`、`makeSetDiff` / `makeSequenceDiff` / `makeKeyedDiff`、`pairAsSet` / `pairAsSequence` / `pairByKey` など | Diff の基本（分類 A〜D、status、match、kind / sourceKeys と中身の分離）。方針は [apex-implementation.md](./apex-implementation.md) |
| `diff/list.ts`    | `TypedListItemDiff`、`TypedListDiff`、`TypedObjectDiff`、`makeTypedObjectDiff`、`makeTypedListDiff`、`makeUnchangedItem` / `makeSingleItem` / `makePairedItem`、`MovedFrom`                                           | 配列の要素の差分（要素の差分に `match` / `index` を足した 1 段の形）                                                               |
| `diff/present.ts` | `PresentDiff`、`makePresentDiff`、`presentEntry`、`PropertiesDiff`、`makePropertiesDiff`、`makeOrderedValuesDiff`、`makeUnorderedValuesDiff`                                                                          | ファイルにないことがある値の差分（両方になければ出さない、片方だけなら added / removed）                                           |
| `diff/unit.ts`    | `IdParseResult`、`IdUnitDiff`、`ContentMaker`、`makeIdUnitDiffs`                                                                                                                                                      | 解析の単位 (フォルダ・バンドル) を id で対応付ける差分。メタデータ (オブジェクト・翻訳) と LWC (バンドル) で共通                   |
| `diff/gumtree/`   | `GumTreeLanguage`、`makeGumTreeBuilder`、`matchTrees`、`makeGumTreeDiff`                                                                                                                                              | GumTree (木の対応付け)。言語ごとの違い (ラベルの付け方など) は `GumTreeLanguage` で渡す                                            |
| `diff/change.ts`  | `hasChange`                                                                                                                                                                                                           | 差分の木に unchanged 以外があるか                                                                                                  |
| `diff/typed.ts`   | `makeTypedArrayDiff`、`makeTypedDiffContext`、`TypedDiffBuilder`、`TypedItemDiffer`、`TypedDiffContext`                                                                                                               | GumTree の対応から型付きのリスト Diff（文の並びなど）を作る。Apex・LWC で共通                                                      |
| `diff/formula.ts` | `makeFormulaDiff`、`FormulaDiff`、`FORMULA_GUMTREE_LANGUAGE`                                                                                                                                                          | 数式（`fx*`）の差分。両方が数式の木なら GumTree で木の差分、どちらかが読めなかった数式（文字列）なら値として比べる                 |

並びの差分の部品（`diff/present.ts`）の使い分け:

| 部品                      | 使う並び                                                               | 組にする要素                                   | 例                                                                            |
| ------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `makeOrderedNamesDiff`    | 名前の並び（順序が表示順。名前が違えば別のもの）                       | 同じ名前だけ（違う名前を「値の変更」にしない） | 検索レイアウトの項目、Lightning ページの項目、アプリのタブ、identifier の並び |
| `makeOrderedValuesDiff`   | 値の並び（順序が表示順。同じ位置の値が変わったら「変更」と見たいもの） | 違う値も、位置が合えば組にする                 | リストビューの列の設定、項目セットの項目の設定                                |
| `makeUnorderedValuesDiff` | 集合（順序に意味がない）                                               | 同じ値だけ。changed は作らない                 | `skippedElements`、レコードタイプの選択リスト値                               |

GumTree の本体（木の作り方・対応付け・差分への変換）と、それを使う型付きのリスト Diff（`makeTypedArrayDiff`。`diff/typed.ts`）は `processor/commons/diff/` で共通にし、Apex のラベルの付け方（`APEX_GUMTREE_LANGUAGE`）は Apex 側（`processor/Apex/diff/gumtree/tree.ts`）に置く（2026-11-17 時点では、以前 Apex 側にあった `typed.ts` は共通側に移した）。LWC の Diff での共通化は [lwc-implementation.md](./lwc-implementation.md)。

### 2.4 worker

| ファイル        | 主なもの                                                                       | 内容                                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unitWorker.ts` | `UnitWorker`、`UnitTask`、`runUnitTask`、`WorkerOptions`                       | すべての単位の種類の解析を、メインスレッドか worker_threads のプール（`useThreads`）で行う（`parse(unitType, root, location)` / `parseAll(root, types?)`。保存はしない）。タスクは `{ command: 'parse', unitType, root, location }` だけ |
| `workerPool.ts` | `WorkerPool`、`registerWorkerTask`、`mapWithConcurrency`、`defaultConcurrency` | worker_threads のプール（タスクをキューに積み、空いたスレッドに 1 件ずつ渡す）と、並列数を絞った map                                                                                                                                     |

### 2.5 単位の種類（`unit/`）

種類ごとの違いを 1 つの定義（`UnitType`）にまとめ、一覧（`UNIT_TYPES`）から読み込み・保存・worker・Diff が引く。方針は [analysis-plan.md](./analysis-plan.md) 2 章。

| ファイル                     | 主なもの                                                                                               | 内容                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceTree.ts`              | `SourceTree`、`WorkingTree`、`GitTree`                                                                 | ファイルの木。作業ツリーと git のある時点（コミット・index）を同じ形（ファイルの一覧と中身）で読む。`GitTree` は subdirectory を根にできる                                                                                                                                                                                            |
| `unitType.ts`                | `UnitType`、`UNIT_TYPES`、`findUnitType`、`unitName`、`UNIT_FORMAT_VERSIONS`、`metadataFolderUnitType` | 種類ごとの「系統と JSON の形の版（`lineage`・`formatVersion`）」「id の接頭辞（`prefix`）」「どのファイルが単位か（`locate`・`exists`・`filesOf`）」「文字列から parse（`parseUnit`）」「単位の名前（`name`）」「単位の Diff（`diffs`）」。保存・読み込みは持たない（UnitStore が行う）。Apex はクラス・トリガー・匿名 Apex の 3 種類 |
| `repository.ts`              | `Repository`、`locateUnits`、`changedUnits`、`renamedUnits`、`relativeGitFiles`、`diffRepositories`    | ある時点のリポジトリ（種類 → 解析結果）。木からの読み込み（`Repository.load`）・変わった単位だけの読み直し（`update`）・git の rename を使った単位の対応付け                                                                                                                                                                          |
| `store.ts`・`storeSqlite.ts` | `UnitStore`                                                                                            | 保存の置き場。SQLite の 1 ファイル（`<savingRoot>/store/metascope.db`）に、ソース・解析結果などを単位ごとに保存する。変わっていない単位は保存した解析結果を使い回す                                                                                                                                                                   |
| `processor.ts`               | `RepositoryProcessor`                                                                                  | 処理の入口。保存した基準（before）と作業ツリー（after）を持ち、差分・レポートの入力・依存関係のグラフを作る                                                                                                                                                                                                                           |

worker は `UnitWorker`（`worker/unitWorker.ts`）1 つで、すべての種類を扱える（タスクは「単位の種類 + 単位の場所」）。

## 3. 新しい種類を足すとき

[analysis-plan.md](./analysis-plan.md) の未対応のメタデータ（Flow・権限など）を足すときの手順。LWC・オブジェクトの翻訳もこの手順で作った。

1. **型**（`types/<種類>/`）: kind ごとの `*Json` と `make*Json`。XML は `xmlJson.ts` の `readXmlRoot` / `readProperties` / `makeXmlJson` で作る（中間表現は作らない）。XML 以外で位置の範囲を持つ木（HTML・CSS など）は `spanJson.ts` の `makeSpanJson`。出力は `JsonType` / `StructureJsonType`（`kind` / `sourceKeys`）にそろえる。
2. **parser**（`parser/<種類>/`）: Apex・LWC と同じく、フォルダの読み込み（`folder.ts`）と、読んだ中身の解析（ファイルシステムに触らない）を分け、入口のクラスは「探す・読む」と、開発者でのデータ確認用の JSON の保存（`*ForDeveloper`）だけを持つ。解析結果は `{ filePath, resolvedError, dataType, result: { id, base, sourceObject } }`。1 単位 = 1 解析結果。id は種類の接頭辞を付ける（`<接頭辞><名前>`）。本番の保存・読み込みは parser に書かない（UnitStore が単位ごとに SQLite に保存する）。
3. **diff**（`processor/<種類>/diff/`）: 単位は `makeIdUnitDiffs`、中は `processor/commons/diff/` の部品（`makeNodeDiff`・`makeKeyedDiff`・`makePresentDiff` など）。木の対応付けが要るときは `GumTreeLanguage` を書く。
4. **単位の種類**（`unit/unitType.ts`）: `UnitType`（`type`・`lineage`・`prefix`・`locate`・`exists`・`filesOf`・`parseUnit`・`name`・`diffs`）を書き、`UNIT_TYPES` に足す。フォルダ単位のメタデータなら、`parser/Metadata/folders.ts` の `METADATA_FOLDER_PARSERS` に設定（`MetadataFolderSpec`）を足せば、`metadataFolderUnitType` で単位の種類になる。新しい系統なら `UnitLineage`・`UNIT_FORMAT_VERSIONS` にも足す。保存（UnitStore）・worker（UnitWorker）・`Repository` は `UNIT_TYPES` を引くので、何も足さなくてよい。
5. **サンプル**: サンプルのリポジトリ `docs/examples/repository/{before,after}` の種類のフォルダにファイルを置き、動作確認のスクリプトと生成物は `docs/examples/<種類>/`（`scripts/`・`output/`）。Diff のテストも足す。
