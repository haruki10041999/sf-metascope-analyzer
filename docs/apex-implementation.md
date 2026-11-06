# Apex の実装まとめ

Apex（クラス・トリガー・匿名 Apex と、クラス・トリガーの `-meta.xml`）を読み、JSON にし、前回との差分を取る実装の全体像。

- JSON の型: [apex-json-reference.md](./apex-json-reference.md)
- Diff: 全体の方針 [apex-json-diff-policy.md](./apex-json-diff-policy.md)、宣言 [apex-declaration-diff.md](./apex-declaration-diff.md)、文・ブロック（GumTree）[apex-gumtree-diff.md](./apex-gumtree-diff.md)
- 解析（計画）: [apex-json-analysis.md](./apex-json-analysis.md)

## 1. 処理の流れ

```text
classes/Foo.cls + Foo.cls-meta.xml / triggers/Bar.trigger + Bar.trigger-meta.xml / *.apex
   │ searchApexUnits / readApexUnit: フォルダごとに、ソースと -meta.xml を 1 つの単位にまとめて読む (folder.ts)
   ▼
parseApexUnitFiles (unit.ts。ファイルシステムに触らない)
   ├─ ソース      ANTLR (@apexdevtools/apex-parser。リスナーで構文エラーを集める)
   │              → apex_IR (UnitVisitor) → converter (convertApexUnit) → JSON (make*Json)   (source.ts)
   └─ -meta.xml   parseXml → JSON (makeApexMetaJson)                                            (meta.ts)
   ▼
ApexUnitParseResult (1 単位 = 1 解析結果 = 1 保存ファイル class_<名前> / trigger_<名前> / anonymous_<名前>)
   └─ diff: makeApexUnitDiffs (processor/Apex/diff/unit.ts)
```

## 2. 単位

| 単位      | ファイル                               | id・保存名         |
| --------- | -------------------------------------- | ------------------ |
| クラス    | `Foo.cls` + `Foo.cls-meta.xml`         | `class_Foo`        |
| トリガー  | `Bar.trigger` + `Bar.trigger-meta.xml` | `trigger_Bar`      |
| 匿名 Apex | `script.apex`（1 ファイル）            | `anonymous_script` |

- 同じフォルダの中で、名前でソースと `-meta.xml` を組にする。どちらか片方だけの単位もある。`ApexParser.parseApexUnit` には、単位のどちらのファイルを渡しても同じ結果になる。
- `result.base`（`ApexUnitJson`）は `{ name, unitType, source?, meta? }`。`source` は `{ fileName, fileType: 'cls' | 'trigger' | 'anonymous' | 'error', content }`、`meta` は `{ fileName, meta: ApexMetaJson | ErrorJson }`。
- `resolvedError` は、ソースの構文エラー・IR を作れなかったところ（`phase: 'syntax' | 'analyzer'`）と、`-meta.xml` を読めなかったもの（`XML_SYNTAX` / `UNEXPECTED_ROOT`）をまとめて持ち、`filePath`（ファイル名）で区別する。
- -meta.xml の `<status>`（Active / Inactive）は、差分の `status`（unchanged / changed …）と同じ名前になる。差分の木をたどるときは、`status` が差分の語彙のときだけ差分のノードとみなし、ノードの `value`（元の JSON）には入らないこと。
- ソースは LF にそろえてから読む（CRLF / LF の違いで `sourceKey` が変わらないように）。

## 3. 構成

```text
src/analyzer/
├── types/apex_IR/           ANTLR の文脈から作る IR (<分類>Visitor/ の TypeClass)。作れなかったところは ApexErrorTypeClass
├── types/apex/converter/    IR → CommonType。nodes.ts (出力の型) と generic.ts (1 つの変換。名前の違いだけ APEX_CONVERT_OVERRIDES)
├── types/apex/              JSON の型と make*Json (unit / declaration / statement / expression / query / modifier / param / type / meta)
│   └── commons/             makeConvertType (objectKey / sourceKey と sourceObject)、regenerateSourceObjects (JSON に残った位置だけにする)
├── parser/Apex/
│   ├── parser.ts            ApexParser: searchApexUnits / parseApexUnit / parseApexUnits / saveApexUnit / readApexMsgPack / readSavedApexUnits
│   ├── folder.ts            フォルダごとに単位にまとめて読む
│   ├── unit.ts              単位の型と解析 (ファイルシステムに触らない)
│   ├── source.ts  meta.ts   ソース・-meta.xml 1 つの解析 (ソースの文字列を受け取る)
│   └── errorListener.ts     ANTLR の構文エラーと IR のエラーを ApexResolvedError にする
├── processor/Apex/diff/     unit (単位) / unitBody (ソース・-meta.xml の中身) / declaration / statement (GumTree) / expression / query / modifier / param / type
└── worker/apexWorker.ts     ApexWorker (1 単位 = 1 タスク)
```

キーの作り方（Apex・LWC・メタデータで共通）:

| キー        | 計算元                                                                              | 変わる条件                           |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| `objectKey` | `${kind}_${hash(内容)}`。内容は位置を除いたもの（子孫を含む。キーの順序に依らない） | 中身（子孫を含む）が変わったとき     |
| `sourceKey` | `${kind}_${hash(位置)}`                                                             | 中身が変わったとき、位置がずれたとき |

`objectKey` が同じなら子孫まで同じ内容（Diff は中に入らずに `unchanged` にする）。空白・改行・コメント・位置の移動では変わらない。同じ内容の文が複数あれば重複する。

## 4. Diff

`makeApexUnitDiffs(before, after)` は単位を id で対応付け（LWC・オブジェクトと共通の `makeIdUnitDiffs`）、中身はソースと `-meta.xml` に分けて比べる。

| 対象                               | 方法                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 単位                               | id で対応付け。片方にしかなければ `added` / `removed`。`resolvedError` は B. 集合                             |
| ソース（`content.fields.source`）  | 種類が同じでどちらも読めれば `makeUnitContentDiff`（宣言・文・式・SOQL の型付きの差分）。そうでなければ値ごと |
| -meta.xml（`content.fields.meta`） | 種類が同じでどちらも読めれば値ごとの差分（`apiVersion`・`status`・`packageVersions`）。そうでなければ値ごと   |

宣言は名前で対応付け（D）、文の並びは GumTree で対応付けて移動を見つける。分類（A. スロット / B. 集合 / C. 順序付き列 / D. キー対応）・`status`・`match` は [apex-json-diff-policy.md](./apex-json-diff-policy.md)。

## 5. サンプルとテスト

| 内容                           | 場所                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| サンプル・生成スクリプト・出力 | [examples/apex/](./examples/apex/)（[examples/README.md](./examples/README.md)）            |
| テスト                         | `test/apex_IR/`、`test/converter/`、`test/parser/apex-*.test.ts`、`test/processor/`（Diff） |

## 6. 未実装

- 解析（宣言の一覧、SOQL / DML、呼び出し関係、ファイルをまたぐ名前解決、メトリクス、ルール違反）: [apex-json-analysis.md](./apex-json-analysis.md)。
- 文字列からの parse の入口は `parseApexUnitFiles`（git の before 側など、作業ツリーにない中身を読むのに使える）。git の範囲から before / after を組み立てる処理は未実装（[report-components-plan.md](./report-components-plan.md) 3.1）。
