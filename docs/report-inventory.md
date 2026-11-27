# Provider と部品の現状（2026-11-27）

レポートの provider（データ）と部品（描き方）の、今の状態と詳細の一覧です。登録の正は `src/analyzer/report/registry.ts`（provider）と `src/report/catalog.ts`（部品）で、引数と出力の詳しい形は `docs/catalog/report-catalog.md`（`npm run catalog` で作る）にあります。計画の正は `docs/plan.md`（8 章・10 章）、作り方は `docs/plan-details.md` の G（予定の部品・provider）と H（5 章の提案）です。

- **状態**: 済み（追加済み・修正済み）／一部済み（使えるが、計画の残りがある）／予定（追加予定。今、作りかけのものはない）
- **最近**: 11/25 以降に追加・修正したもの（コミット `175c80c` のあと）
- 最後の「5. 新しく足すもの・直すもの（提案）」は、この一覧から見えた足りないところです。`docs/plan.md` 10 章にも項目として足し、作り方を `docs/plan-details.md` の H に書きました。

## 1. 数

| 種類     | 済み | 一部済み | 予定 |
| -------- | ---- | -------- | ---- |
| provider | 56   | 1        | 26   |
| 部品     | 25   | 2        | 8    |

## 2. provider（済み・一部済み。57）

出力の形: rows（行の並び）・matrix（行列）・diagram（図のデータ）・object（専用の形）。「比べる時点が要る」は、diff か compare がないと使えない provider です。

### メタデータ・オブジェクト・翻訳・ラベル（13）

| provider                     | 形      | 部品                     | 状態 | 中身                                                                       |
| ---------------------------- | ------- | ------------------------ | ---- | -------------------------------------------------------------------------- |
| `metadata.types`             | rows    | DataTable・StatusSummary | 済み | 単位の種類ごとの数（読めなかった・エラーのあるもの）。棚卸しの目次         |
| `metadata.units`             | rows    | 同上                     | 済み | すべての種類の単位の一覧（専用の provider がない種類も）                   |
| `metadata.properties`        | rows    | 同上                     | 済み | 単位の設定値を「場所 → 値」の行で（XML のメタデータすべて）                |
| `object.list`                | rows    | 同上                     | 済み | オブジェクトの一覧（ラベル・種類・共有設定・数）                           |
| `object.fields`              | rows    | 同上                     | 済み | 項目の一覧（型・必須・参照先・数式・選択リスト・ヘルプ。暗黙の標準項目も） |
| `object.picklists`           | rows    | 同上                     | 済み | 選択リスト値（順・既定・有効・色・連動）                                   |
| `object.validationRules`     | rows    | 同上                     | 済み | 入力規則                                                                   |
| `object.recordTypePicklists` | rows    | 同上                     | 済み | レコードタイプごとの選択リスト値                                           |
| `object.members`             | rows    | 同上                     | 済み | オブジェクトの子（レコードタイプ・リストビュー・ボタンなど）               |
| `object.diagram`             | diagram | ObjectDiagram            | 済み | ER 図（起点と段数で絞る）                                                  |
| `translation.coverage`       | rows    | DataTable・StatusSummary | 済み | 翻訳の網羅（オブジェクト × 言語）                                          |
| `translation.items`          | rows    | 同上                     | 済み | 翻訳する項目ごとの翻訳元・訳・状態                                         |
| `label.definitions`          | rows    | 同上                     | 済み | カスタム表示ラベルの定義と各言語の訳                                       |

### 権限（5）

| provider                  | 形     | 部品                     | 状態 | 中身                                               |
| ------------------------- | ------ | ------------------------ | ---- | -------------------------------------------------- |
| `permission.diffs`        | rows   | DataTable・StatusSummary | 済み | 権限セット・プロファイルの変更（比べる時点が要る） |
| `permission.objectAccess` | matrix | Matrix                   | 済み | 権限 × オブジェクトの CRUD                         |
| `permission.fieldAccess`  | matrix | Matrix                   | 済み | 権限 × 項目の参照・編集                            |
| `permission.apexAccess`   | rows   | DataTable・StatusSummary | 済み | 実行できる Apex クラス・Visualforce                |
| `permission.effective`    | rows   | 同上                     | 済み | 権限セットグループが実際に与える権限               |

### Flow・自動化・画面（11）

| provider              | 形      | 部品                     | 状態             | 中身                                                                               |
| --------------------- | ------- | ------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| `flow.list`           | rows    | DataTable・StatusSummary | 済み             | Flow の一覧                                                                        |
| `flow.diagram`        | diagram | FlowDiagram              | 済み             | Flow の要素と接続の図                                                              |
| `flow.elements`       | rows    | DataTable・StatusSummary | 済み             | 要素の中身（「場所 = 値」）                                                        |
| `flow.diffs`          | rows    | 同上                     | 済み             | 要素・資源・起動の変更（比べる時点が要る）                                         |
| `flow.references`     | rows    | 同上                     | 済み             | Flow が参照するもの（ない参照先は problem）                                        |
| `flow.interface`      | rows    | 同上                     | 済み             | 入力・出力の変数                                                                   |
| `automation.byObject` | object  | AutomationView           | 済み             | オブジェクトごとの自動化と順序                                                     |
| `layout.detail`       | object  | LayoutView               | 済み             | ページレイアウト                                                                   |
| `flexiPage.detail`    | object  | FlexiPageView            | 済み             | Lightning ページ                                                                   |
| `lwc.placements`      | rows    | DataTable・StatusSummary | 済み             | LWC の置き場所                                                                     |
| `object.usage`        | rows    | 同上                     | 済み（最近追加） | オブジェクトごとの、使っている単位と操作（照会・作成・更新・削除・項目の読み書き） |

### Apex（10）

| provider               | 形      | 部品                     | 状態             | 中身                                                                                                                              |
| ---------------------- | ------- | ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `apex.outline`         | rows    | DataTable・StatusSummary | 済み             | クラス・トリガーのすべてのメンバー（`signature` の列は予定）                                                                      |
| `apex.interface`       | rows    | 同上                     | 済み             | 外から使えるクラス・メンバー                                                                                                      |
| `apex.methodFlow`      | diagram | CodeFlowchart            | 済み             | メソッドの処理フロー                                                                                                              |
| `apex.callFlow`        | diagram | SequenceDiagram          | 済み（最近修正） | 呼び出しのシーケンス図。動的 SOQL の対象が出るようになった（`query Account`）                                                     |
| `apex.dataAccess`      | rows    | DataTable・StatusSummary | 済み（最近修正） | どこでどのオブジェクト・項目を読み書きするか。クエリの `WITH` の守り方（`accessLevel`）と、動的 SOQL の復元した対象・項目を足した |
| `apex.metrics`         | rows    | 同上                     | 済み（最近追加） | 本体ごとのメトリクス（複雑度・文の数・ネスト・SOQL / DML（ループの中も）・呼び出し）                                              |
| `apex.unusedMethods`   | rows    | 同上                     | 済み（最近追加） | 呼ばれていないメソッド（unused・candidateOnly）                                                                                   |
| `apex.entryPoints`     | rows    | 同上                     | 済み（最近追加） | 外から呼ばれるメソッド（REST・@AuraEnabled・@InvocableMethod・@RemoteAction・webservice・@future）と呼んでいる単位                |
| `apex.triggerHandlers` | rows    | 同上                     | 済み（最近追加） | トリガーから届くクラス（段数・経路）                                                                                              |
| `apex.tests`           | rows    | 同上                     | 済み（最近追加） | クラス・トリガーごとの届くテスト（呼び出し・DML で動くトリガー経由）                                                              |

### LWC（7）

| provider         | 形      | 部品                     | 状態             | 中身                                                |
| ---------------- | ------- | ------------------------ | ---------------- | --------------------------------------------------- |
| `lwc.components` | rows    | DataTable・StatusSummary | 済み             | コンポーネントの一覧                                |
| `lwc.detail`     | rows    | 同上                     | 済み             | コンポーネントの中身（@api・@wire・Apex・項目など） |
| `lwc.interface`  | rows    | 同上                     | 済み             | 親から使えるもの                                    |
| `lwc.metrics`    | rows    | 同上                     | 済み（最近追加） | 本体ごとのメトリクス（Apex の呼び出し・イベントも） |
| `lwc.methodFlow` | diagram | CodeFlowchart            | 済み             | メソッド・関数の処理フロー                          |
| `lwc.eventFlow`  | diagram | EventFlow                | 済み             | 利用者の操作から処理までの流れ                      |
| `lwc.wireframe`  | diagram | LwcWireframe             | 済み             | 画面の骨組み                                        |

### 参照・依存関係・指摘（11）

| provider                  | 形      | 部品                     | 状態                     | 中身                                                                                                                                                                          |
| ------------------------- | ------- | ------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crossRef.labels`         | rows    | DataTable・StatusSummary | 済み                     | ラベルの使われている場所と未使用                                                                                                                                              |
| `crossRef.references`     | rows    | 同上                     | 済み                     | 参照先ごとの逆引き                                                                                                                                                            |
| `metadata.findings`       | rows    | 同上                     | **一部済み**（最近修正） | 解析の指摘。source `apex`（SeeAllData など 4 つ）と、グラフの `APEX_METHOD_NOT_AURA_ENABLED`・`APEX_METHOD_NOT_CACHEABLE` を足した。Apex の指摘は D で `apex.findings` に移す |
| `feature.scope`           | rows    | 同上                     | 済み                     | 起点から依存関係をたどった機能のまとまり                                                                                                                                      |
| `dependency.dependents`   | rows    | 同上                     | 済み（最近修正）         | 使っているもの（逆引き）。下の「依存関係の変更」を受ける                                                                                                                      |
| `dependency.dependencies` | rows    | 同上                     | 済み（最近修正）         | 使っているもの                                                                                                                                                                |
| `dependency.impact`       | object  | ImpactView               | 済み                     | 変わった単位と影響を受ける単位（比べる時点が要る）                                                                                                                            |
| `dependency.missing`      | rows    | DataTable・StatusSummary | 済み（最近修正）         | リポジトリにない参照先。確かめていない名前を standard にしなくなった（unknown と分けた）                                                                                      |
| `dependency.unused`       | rows    | 同上                     | 済み                     | 使われていないもの                                                                                                                                                            |
| `dependency.changes`      | rows    | 同上                     | 済み                     | 依存の増減（比べる時点が要る）                                                                                                                                                |
| `dependency.graph`        | diagram | DiagramText              | 済み                     | 依存関係の図（Mermaid・DOT の文字）                                                                                                                                           |

**依存関係の変更（11/26〜11/27）**: 依存関係のグラフを入力にする provider（`dependency.*`・`feature.scope`・`object.usage`・`apex.unusedMethods`・`apex.tests`・`apex.triggerHandlers`・`crossRef.references`）は、次の変更で拾う参照が増え、分類が正しくなりました。

- SOQL と変数のメンバーの関係のパス（`Account.Owner.Name`）を項目までたどる（`fieldPath`）
- 動的 SOQL の復元（`soql.dynamic`）、変数・連結で渡した名前（`Type.forName(cls)` など）、`Schema.getGlobalDescribe().get`・`rec.get` / `put`
- `@wire` の Apex のメソッドの参照（`via: 'wire'`）
- 確かめていない名前を `standard` にしない（`unknown`）、辺の確かさ（`resolved`・`missing`・`standard`）

## 3. 部品（済み・一部済み。27）

| 分類         | 部品                                                                                                                               | 状態                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 配置・文章   | `Card`・`Stack`・`Grid`・`Separator`・`Tabs`・`Accordion`・`Heading`・`Text`・`Badge`・`Alert`・`Columns`・`PageLink`・`Narrative` | 済み                                                                                                                             |
| 表           | `DataTable`                                                                                                                        | **一部済み**（最近修正）: 並べ替え・列の出し分け・CSV の書き出しを足した（`RowsTable`）。列の書式（bar・threshold・badge）は予定 |
| 表           | `StatusSummary`                                                                                                                    | **一部済み**: 件数のカード。割合のチャート（`Chart`）は予定                                                                      |
| 表           | `Matrix`                                                                                                                           | 済み（行列の形の一般化は予定）                                                                                                   |
| 図           | `FlowDiagram`・`ObjectDiagram`・`CodeFlowchart`・`EventFlow`                                                                       | 済み（自動配置は dagre。elkjs への移行は予定）                                                                                   |
| 図           | `LwcWireframe`・`SequenceDiagram`・`DiagramText`                                                                                   | 済み                                                                                                                             |
| 専用のビュー | `LayoutView`・`FlexiPageView`・`AutomationView`・`ImpactView`                                                                      | 済み                                                                                                                             |

## 4. 予定（追加予定・計画にある修正）

`docs/plan.md` 8.2〜8.5 と `docs/plan-details.md` の G・D の順。

### 部品（新しい部品 6・移行 1）

| 部品                           | 段  | 中身                                                                             | 節（plan-details） |
| ------------------------------ | --- | -------------------------------------------------------------------------------- | ------------------ |
| 図の自動配置の elkjs への移行  | 1   | 共通の `elkLayout`。今の 4 つの図を移し、dagre を外す                            | G-2                |
| `GraphView`                    | 1   | ノードと線のグラフ（elkjs。階層・木・放射・力学、入れ子・直角の線）              | G-3                |
| `Chart`                        | 1   | 行のチャート（recharts。棒・積み上げ・円・レーダー・散布・ツリーマップ・Sankey） | G-4                |
| `FindingsList`                 | 2   | 指摘の一覧と根拠                                                                 | G-6                |
| `CodeView`                     | 2   | ソースの行に印                                                                   | G-6                |
| `DataFlowGraph`                | 2   | 変数の定義 → 読みの線                                                            | G-6                |
| `ExecutionOrder`               | 2   | 保存のときの実行順                                                               | G-6                |
| `DependencyMatrix`・`DiffTree` | 3   | 依存の行列・構造の差分の木                                                       | G-11               |

今ある部品の修正: `DataTable` の列の書式、`StatusSummary` のチャート、`CodeFlowchart`（届かない箱・ループの中の SOQL の経路・ループと try の枠）、`EventFlow`（コンポーネントの枠）、`FlowDiagram` と `CodeFlowchart` の箱の形と色、`Matrix` の一般化、`AutomationView` の実行順（G-8）。

### provider（26）

| 段  | provider                                                                                                                                                                                                | 節         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `apex.callGraph`・`apex.classDependencies`・`dependency.graphData`・`dependency.cycles`・`lwc.componentTree`・`lwc.callGraph`・`lwc.apexCalls`・`apex.symbols`・`crossRef.fieldUsage`・`lwc.fieldUsage` | G-5        |
| 2   | `apex.findings`・`lwc.findings`                                                                                                                                                                         | D          |
| 2   | `apex.variables`・`apex.dynamicQueries`・`apex.sourceMarks`・`apex.testMap`・`apex.impact`・`automation.executionOrder`                                                                                 | G-7        |
| 3   | `apex.slice`・`architecture.layers`・`architecture.communities`・`git.hotspots`・`git.coupling`                                                                                                         | G-11       |
| —   | 差分の provider（`object.fieldDiffs`・`apex.diffs`・`lwc.diffs` など）、自動化の中身、権限の残り、本文のテキスト、`lwc.snapshot`                                                                        | plan 10 章 |

## 5. 新しく足すもの・直すもの（提案）

この一覧と、C（値の解析）でできた解析から見えたものです。どれも `docs/plan.md` 10 章の「P4: コンポーネント」に項目として足しました。作り方は `docs/plan-details.md` の H（H-1: 新しい provider、H-2: 列、H-3: `apex.unreachable`、H-4: 部品）です。

### 新しく足す provider

| provider              | 形   | 中身                                                                                                                                                                 | 理由                                                                                                                                            |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `apex.loopOperations` | rows | ループの中の SOQL・SOSL・動的なクエリ・DML（`semantic/loopOperations.ts`）。直接か、ループの中から呼んだメソッドの先か（呼び出しの並び）。メンバー・種類・操作・位置 | 解析はできているが、見る手段がない。指摘（D）にする前でも、ガバナ制限のリスクの一覧として使える。`apex.dataAccess` の `inLoop` は直接のものだけ |
| `apex.security`       | rows | SOQL・DML ごとの守り方（userMode・securityEnforced・systemMode・stripInaccessible・none）と、クラスの共有の宣言（`semantic/security.ts`）                            | 同上。`security_overview` の雛形の表になる                                                                                                      |
| `apex.unreachable`    | rows | 届かない文（`return`・`throw`・`break` / `continue` のあと）。CFG の到達性（`reachableApexCfgNodes`）                                                                | `plan.md` 10 章「到達性解析」の一部が、CFG でもう求まる。`CodeFlowchart` の灰色の箱と同じ根拠                                                   |

### 今ある provider の修正

| provider                              | 直すこと                                                                                                                                                                                                 | 理由                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `apex.dataAccess`                     | 列を足す: 動的なクエリの復元の度合い（`restoration`: complete・partial・none）と、守り方（`enforcement`。`security.ts` の結果）。`inLoop` に「ループの中から呼んだ先」も含めるか、`loopVia` の列で分ける | 1 つの表でデータアクセスの安全さまで見られる。復元の度合いがないと、動的なクエリの行の対象が「ない」のか「分からない」のか区別できない |
| `dependency.missing`                  | 引数 `includeUnknown`（既定 false）を足し、確かめられない名前（`origin: unknown`）も出せるようにする。列 `origin`                                                                                        | 標準の一覧にない名前を unknown にしたので、綴りの誤りや一覧にない標準オブジェクトを探せる                                              |
| `object.usage`・`crossRef.references` | 列 `vias`（`soql.select`・`soql.dynamic`・`SObject.get` など）を足す                                                                                                                                     | 動的 SOQL・文字列の名前から来た参照（確かさが低い）を、静的な参照と見分けられる                                                        |
| `metadata.findings`                   | 指摘の列にルールの説明（`description`）と、根拠の位置（`sourceKeys` から行番号）を足す。Apex の指摘は D で `apex.findings` に移す                                                                        | `FindingsList` で根拠を見せるため                                                                                                      |
| `apex.metrics`                        | 列 `soqlInLoopViaCalls`・`dmlInLoopViaCalls`（ループの中から呼んだ先の操作の数。`loopOperations.ts`）                                                                                                    | 今の `soqlInLoop` は直接のものだけで、呼び出しの先のガバナ制限のリスクが数に出ない                                                     |
| `apex.entryPoints`                    | `aura` の行に、LWC の `@wire` から使われているのに `cacheable` でないこと（グラフの `APEX_METHOD_NOT_CACHEABLE`）を `problem` の列で出す                                                                 | 公開 API の一覧で、そのまま直すべきものが分かる                                                                                        |
| `apex.outline`                        | `signature` の列（計画済み）                                                                                                                                                                             | オーバーロードを見分ける                                                                                                               |

### 部品の修正

| 部品            | 直すこと                                                                                                                              | 理由                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `DataTable`     | 列の書式（計画済み）に加えて、セルの値が `sourceKeys` を持つ行で「ソースへ」のリンク（`CodeView` ができたら、そのページの行へ）を出す | 指摘・データアクセスの表から、すぐソースを見られる |
| `CodeFlowchart` | `apex.loopOperations` の「ループの中から呼んだ先」も、呼び出しの箱に印を付ける                                                        | 呼び出しの先のガバナ制限のリスクを図で見せる       |

## 6. Apex・LWC・メタデータの解析の揃え

同じ解析の手法を、Apex・LWC・メタデータ（主に Flow。数式・Aura・Visualforce は表の下）でそろえるための対応表です。そろえる理由は 3 つです。

- 同じ雛形・部品（`FindingsList`・`Chart`・`GraphView`）で 3 つを並べて見せられる。
- 同じ問いに 3 つまとめて答えられる（「ループの中で DML しているところ」「使われていないもの」）。
- 3 つの間を辿れる（LWC → Apex → オブジェクト ← Flow）。

**記号**: ○ provider で見られる／△ 解析はあるが、provider がないか一部だけ／× 解析がない／— 当てはまらない（そろえなくてよい）

### 6.1 対応表

| 解析の手法                   | Apex                                                                                      | LWC                                                                                                                    | メタデータ（Flow）                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 一覧・構造                   | ○ `apex.outline`                                                                          | ○ `lwc.components`・`lwc.detail`                                                                                       | ○ `flow.list`・`flow.elements`（ほかのメタデータは `object.*`・`metadata.units`・`metadata.properties`）                               |
| 公開 API                     | ○ `apex.interface`                                                                        | ○ `lwc.interface`                                                                                                      | ○ `flow.interface`（入力・出力の変数）                                                                                                 |
| 入口（外から動き出すところ） | ○ `apex.entryPoints`・`apex.triggerHandlers`                                              | ○ `lwc.placements`（置き場所）。js-meta.xml の target は `lwc.components`                                              | △ `flow.list` の起動（`triggerType`・`object`）。画面フローの置き場所・ボタン・Apex からの起動（`Flow.Interview`）をまとめたものはない |
| 処理フローの図               | ○ `apex.methodFlow`                                                                       | ○ `lwc.methodFlow`                                                                                                     | ○ `flow.diagram`                                                                                                                       |
| 制御フローグラフ（解析用）   | △ `semantic/cfg.ts`（provider なし）                                                      | × （`walker.ts` の深さの文脈だけ。C の終わりの確かめ）                                                                 | △ `flowAnalysis.ts` の `FlowGraph`（要素と接続。到達性の指摘だけに使う）                                                               |
| 到達できないもの             | △ `reachableApexCfgNodes`（provider なし。H-3 の `apex.unreachable`）                     | ×                                                                                                                      | ○ 指摘 `UNREACHABLE_ELEMENT`（`metadata.findings`）                                                                                    |
| 失敗の経路                   | △ CFG の例外の辺（provider なし）                                                         | △ `promiseUsesIn` の `catch`・`finally`（`calls.ts`。provider なし）                                                   | ○ 指摘 `NO_FAULT_PATH`                                                                                                                 |
| 値の流れ（到達定義・定数）   | △ `semantic/dataflow.ts`（provider なし。G-7 の `apex.variables`）                        | ×                                                                                                                      | × （変数・割り当て・数式の資源の流れ）                                                                                                 |
| 呼び出しの流れ               | ○ `apex.callFlow`（シーケンス図）                                                         | ○ `lwc.eventFlow`（操作 → 処理）                                                                                       | × （サブフロー・Apex のアクション・画面の LWC への呼び出しの並び）                                                                     |
| 呼び出しグラフ               | △ グラフの `calls` の辺（G-5 の `apex.callGraph`）                                        | × モジュールをまたぐ関数（`calls.ts` の `callType: 'module'` だけ。G-5 の `lwc.callGraph`）                            | △ グラフの辺（サブフロー・Apex・LWC）。Flow を起点にした図はない                                                                       |
| データアクセス               | ○ `apex.dataAccess`（SOQL・SOSL・DML・項目の読み書き・守り方）                            | △ `lwc.detail` に `@wire`・schema の項目。LDS の書き込み（`updateRecord`・`createRecord`・`deleteRecord`）の一覧はない | △ グラフ経由で `object.usage` に出る。要素ごとの読み書き（Get / Create / Update / Delete Records と項目）の表はない                    |
| ループの中の操作             | △ `apexLoopOperationsOf`（provider なし。H-1）。`apex.metrics` の `soqlInLoop` は直接だけ | △ `lwc.metrics` の `apexCallsInLoop`（数だけ。場所は出ない）                                                           | × ループの中の Get Records・DML（Flow でいちばん多いガバナ制限の問題）                                                                 |
| 守り方（権限・共有）         | △ `apexSecurityChecksOf`（provider なし。H-1）                                            | — （LDS は利用者の権限で動く。呼ぶ Apex の守り方は Apex の側で見る）                                                   | × `runInMode`（システムモードで動くか。XML は読んでいるが解析していない）                                                              |
| 動的・文字列の参照           | ○ 動的 SOQL の復元・`Type.forName` などを依存関係に（`soql.dynamic`）                     | △ `@wire` の文字列の項目・動的 import は拾う。`getFieldValue(record, 'Account.Name')` などの文字列の項目は未確認       | △ 差し込み（`{!$Record.Name}`）・数式の項目は `flowRefs.ts` で拾う。文字列の変数で渡す名前は拾わない                                   |
| メトリクス                   | ○ `apex.metrics`（循環的・認知的複雑度・文の数・ネスト・SOQL / DML・呼び出し）            | ○ `lwc.metrics`（同じ `SyntaxMetrics` と Apex の呼び出し・イベント）                                                   | △ `FlowInfo.elementCount` だけ。分岐・ループ・データの要素の数、経路の数、入れ子のサブフローの深さがない                               |
| 使われていないもの           | ○ `apex.unusedMethods`（単位は `dependency.unused`）                                      | △ 単位は `dependency.unused`。使われない `@api`・プロパティ・メソッドはない（10 章「`this.<メンバー>` の読み書き」）   | △ 単位は `dependency.unused`。使われない変数・定数・数式・テキストテンプレートはない                                                   |
| テスト                       | ○ `apex.tests`（届くテスト）                                                              | × Jest のテスト（`__tests__/` は読まずに飛ばしている）                                                                 | × Flow のテスト（`FlowTest` のメタデータを読んでいない）                                                                               |
| 指摘                         | △ 4 つのルールを `metadata.findings` に（D で `apex.findings`）                           | △ `lwc.detail` の中に（`UNKNOWN_COMPONENT` など 9 種）。`metadata.findings` には出ない（D で `lwc.findings`）          | ○ `metadata.findings`（`APEX_NOT_INVOCABLE`・`LWC_NOT_FLOW_SCREEN`・`UNKNOWN_FLOW_ELEMENT`・`UNREACHABLE_ELEMENT`・`NO_FAULT_PATH`）   |
| 変更の差分                   | △ 構造の Diff だけ（`apex.diffs` は予定。意味の差分は G-7 の `apex.impact`）              | △ 構造の Diff だけ（`lwc.diffs`・`lwc.publicApiChanges` は予定）                                                       | ○ `flow.diffs`                                                                                                                         |
| ソースの行に印               | × （G-7 の `apex.sourceMarks`）                                                           | ×                                                                                                                      | — （XML。要素の単位で `flow.elements` に出す）                                                                                         |

**数式・Aura・Visualforce**: 数式（項目・入力規則・Flow の数式）は参照（`dependency/formula.ts`）だけで、メトリクス（長さ・入れ子・関数の数）と指摘はありません。Aura・Visualforce は参照の一部だけで、構造・処理フロー・メトリクスはありません（10 章「Aura の参照」「Visualforce・Aura の専用の解析」）。

### 6.2 解析が足りないもの（provider の前に解析が要るもの）

| 足りない解析             | 対象 | 中身                                                                                                                                                                                                   | 優先 |
| ------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| Flow のループの中の操作  | Flow | `FlowGraph` で Loop 要素の「各項目」の辺から「最後の項目のあと」の辺までに入る要素を求め、その中の Get / Create / Update / Delete Records・サブフロー・Apex のアクションを拾う（サブフローの先も辿る） | 高   |
| Flow のメトリクス        | Flow | 要素の種類ごとの数（分岐・ループ・データ・アクション・画面）、分岐の数からの循環的複雑度、最長の経路、サブフローの深さ。名前は `SyntaxMetrics`（`cyclomatic`・`maxNesting` など）にそろえる            | 高   |
| Flow のデータアクセス    | Flow | 要素ごとのオブジェクト・項目・操作（読む項目は `queriedFields`・`outputAssignments`、書く項目は `inputAssignments`）。`apex.dataAccess` と同じ行の形にする                                             | 中   |
| Flow の実行の文脈        | Flow | `runInMode`（`DefaultMode`・`SystemModeWithSharing`・`SystemModeWithoutSharing`）と、起動の種類から決まる既定。`apexSecurityChecksOf` の `enforcement`・`sharing` と同じ言葉にそろえる                 | 中   |
| Flow の使われない資源    | Flow | 変数・定数・数式・テキストテンプレート・選択肢のうち、どの要素・数式からも参照されないもの（`flowRefs.ts` の参照を Flow の中で集計）                                                                   | 中   |
| Flow の値の流れ          | Flow | 割り当て（Assignment）・要素の出力から変数への流れ。`FlowGraph` の上で到達定義（Apex の `dataflow.ts` の考え方）                                                                                       | 低   |
| LWC の CFG と値の流れ    | LWC  | 「C の終わりに」の確かめの結果しだい。要るのは、`apexCallsInLoop` の場所を出すこと、`then` / `catch` の経路を見せること、`this.<メンバー>` の読み書き                                                  | 中   |
| LWC のメンバーの読み書き | LWC  | テンプレート → getter → フィールドの依存、使われない `@api`・プロパティ・メソッド（10 章 P4 段 2 にある項目）                                                                                          | 中   |
| LWC の LDS の書き込み    | LWC  | `lightning/uiRecordApi` の `updateRecord`・`createRecord`・`deleteRecord` の呼び出しと渡す項目（`calls.ts` の `callType: 'lds'` を、オブジェクト・項目まで解決する）                                   | 中   |
| LWC の文字列の項目       | LWC  | `getFieldValue(record, 'Account.Name')`・`fields: ['Account.Name']` の文字列の項目を参照にする（Apex の `namedReferences.ts` と同じ考え方）。今拾っている範囲を先に確かめる                            | 中   |
| Jest・Flow のテスト      | 両方 | LWC の `__tests__/*.test.js` を読み、どのコンポーネントを import しているか。`FlowTest` のメタデータを読み、どの Flow をテストしているか。`apex.tests` と同じ行の形にする                              | 低   |
| 数式のメトリクスと指摘   | 数式 | 長さ・入れ子・関数の数と、よくある誤り（`ISCHANGED` を作成のときにも評価する入力規則など）の指摘                                                                                                       | 低   |

### 6.3 そろえる provider（提案）

解析ができたら、名前・引数・行の形を Apex にそろえた provider を足します。行の共通の列は `unitType`（`apexClass`・`lwc`・`flow`）・`unit`・`member`（Apex はメソッド、LWC はメンバー・関数、Flow は要素）・`line` か `element` です。こうすると、3 つをまとめた横断の provider（`code.*`）を作れ、1 つの雛形の中で同じ部品で並べられます。

| 手法             | Apex（今か予定）             | LWC（足す）                                                       | Flow（足す）                                                   | 横断（足す）                                                            |
| ---------------- | ---------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| メトリクス       | `apex.metrics`               | `lwc.metrics`（済み）                                             | `flow.metrics`                                                 | — （`Chart` で 3 つを並べる）                                           |
| ループの中の操作 | `apex.loopOperations`（H-1） | `lwc.loopOperations`（ループの中の Apex の呼び出し・LDS）         | `flow.loopOperations`                                          | `code.loopOperations`（3 つをまとめ、Flow → Apex の呼び出しの先も辿る） |
| データアクセス   | `apex.dataAccess`            | `lwc.dataAccess`（`@wire` の読み・LDS の書き・Apex の呼び出し先） | `flow.dataAccess`                                              | `object.usage`（済み。オブジェクトの側から見たもの）                    |
| 守り方           | `apex.security`（H-1）       | —                                                                 | `flow.security`（`runInMode`）                                 | `code.security`（システムモードで動くものの一覧）                       |
| 使われないもの   | `apex.unusedMethods`         | `lwc.unusedMembers`                                               | `flow.unusedResources`                                         | `dependency.unused`（済み。単位の細かさ）                               |
| テスト           | `apex.tests`                 | `lwc.tests`（Jest）                                               | `flow.tests`（`FlowTest`）                                     | `code.tests`（テストのないものをまとめて）                              |
| 指摘             | `apex.findings`（D）         | `lwc.findings`（D）                                               | `flow.findings`（`metadata.findings` の source `flow` を移す） | `metadata.findings`（済み。全部をまとめる入口として残す）               |
| 到達できないもの | `apex.unreachable`（H-3）    | — （LWC の CFG ができてから）                                     | 指摘 `UNREACHABLE_ELEMENT`（済み）を行にする                   | —                                                                       |
| 呼び出しグラフ   | `apex.callGraph`（G-5）      | `lwc.callGraph`（G-5）                                            | `flow.callGraph`（サブフロー・Apex・LWC）                      | `dependency.graphData`（G-5）                                           |

`docs/plan.md` 10 章の「P4: 解析（段 2）」と「P4: コンポーネント」に、6.2 と 6.3 の項目を足しました。作り方は `docs/plan-details.md` の I です。

### 6.4 ほかに足すとよい解析の手法（提案）

6.1 の表にない手法で、Salesforce の開発・保守でよく問われるものです。どれも今ある解析（依存関係のグラフ・C の値の解析・Flow のグラフ・権限の解析）の組み合わせで作れます。対象の列は、当てはまるものに ○ を付けています。

| 手法                                     | 問い                                                                                         | Apex | LWC | Flow | ほか             | 使う解析（今あるもの）                                                                                                               | 足りない解析                                                                                                                                                       | provider（案）                       | 優先 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- | ---- | --- | ---- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---- |
| 保存の連鎖                               | あるオブジェクトを保存すると、どのトリガー・Flow が動き、さらにどのオブジェクトを保存するか  | ○    |     | ○    | 入力規則         | `apex.triggerHandlers`・`apex.tests` の「DML → トリガー」の辿り方（`crossProject.ts` の `apexLinksOf`）、`automation.byObject`       | Flow の DML（I-1）を同じ辿り方に入れる。同じオブジェクトに戻る再帰の検出                                                                                           | `automation.cascade`                 | 高   |
| 同じ項目への書き込みの重なり             | 同じオブジェクトの同じ項目を、複数の自動化が書いていないか（実行順で上書きされる）           | ○    |     | ○    | 項目の自動更新   | `apex.dataAccess` の書き込み、Flow のデータアクセス（I-1）、`automation.executionOrder`（G-7）                                       | 「保存中のレコードへの書き込み」（before トリガーの `Trigger.new` の項目への代入・before-save Flow の `$Record` への割り当て）を区別する                           | `automation.fieldWriteConflicts`     | 高   |
| 1 トランザクションのガバナ制限の見積もり | 入口から辿った経路で、SOQL・DML の数の上限（ループは「ループの中」として印）                 | ○    | ○   | ○    |                  | `apex.entryPoints`、呼び出しグラフ、`apexLoopOperationsOf`、保存の連鎖（上）                                                         | 経路ごとの数の足し上げ（再帰・ループは「上限なし」とする）。トリガーの中の DML で動く連鎖も足す                                                                    | `apex.governorEstimate`              | 中   |
| 非選択的なクエリ                         | 大きいオブジェクトで、索引のない項目だけを条件にした SOQL（全件の走査になる）                | ○    |     | ○    |                  | SOQL の WHERE の解析（`semantic/query.ts`）、Flow の Get Records の条件（`flowRefs.ts`）、項目の定義（外部 ID・一意）                | 索引のある項目の表（Id・Name・OwnerId・CreatedDate・SystemModstamp・RecordTypeId・参照・外部 ID・一意。`docs/reference/` に出典）、`!=`・先頭の `%` の LIKE の判定 | `apex.querySelectivity`              | 中   |
| 例外の伝わり方                           | 入口（`@AuraEnabled`・REST・`@InvocableMethod`）から、捕まえられずに出る例外の種類           | ○    | ○   | ○    |                  | CFG の例外の辺、呼び出しグラフ、`promiseUsesIn` の `catch`（LWC）、`NO_FAULT_PATH`（Flow）                                           | `throw` の型と `catch` の型の照合（今は型を見ずにすべて受ける近似）。メソッド間の要約（10 章の項目）。`@AuraEnabled` で `AuraHandledException` 以外を投げる指摘    | `apex.exceptions`                    | 中   |
| 非同期と外部接続の経路                   | `@future`・Queueable・Batch・Schedulable・プラットフォームイベントの連鎖と、callout の位置   | ○    | ○   | ○    | 指定ログイン情報 | 事実の `async`・`callout`（`semantic/facts.ts` の `ApexCallType`）、`publish`、Flow のプラットフォームイベントの起動                 | 非同期から非同期を呼ぶ制限（future から future など）、callout の宛先（`callout:<指定ログイン情報>`・URL の定数）、LWC の `fetch`                                  | `apex.async`・`integration.callouts` | 中   |
| 実効的なデータアクセス                   | どの権限セット・プロファイルの利用者が、どの入口を通って、どのオブジェクトを読み書きできるか | ○    | ○   | ○    | 権限             | `permission.apexAccess`・`permission.objectAccess`、`apex.entryPoints`、`apex.dataAccess`・`apex.security`、Flow の実行の文脈（I-1） | 「権限 → 入口 → データ」をつなぐ辿り方。システムモードで動く経路は、オブジェクトの権限がなくても届くものとして印                                                   | `security.effectiveAccess`           | 中   |
| 選択リストの値の使用箇所                 | 選択リストの値（`'Closed Won'`）を、どのコード・Flow・数式が文字列で比べているか             | ○    | ○   | ○    | 数式・入力規則   | 値の解析の定数（`dataflow.ts`）、Flow の条件の行、数式の参照、`object.picklists`                                                     | 「項目と比べている文字列の定数」を、項目の選択リストの値と突き合わせる（ない値は指摘）                                                                             | `object.picklistUsage`               | 中   |
| ハードコード                             | Id・URL・利用者名・プロファイル名・組織固有の値を、コード・Flow・数式に直に書いていないか    | ○    | ○   | ○    | 数式             | 値の解析の定数、Flow の定数・数式、LWC の文字列                                                                                      | 値の形の判定（15 / 18 桁の Id・`https://`・`.my.salesforce.com`）。D の `HARDCODED_ID` を 3 つにそろえる                                                           | `code.hardcoded`                     | 中   |
| 画面の文字のハードコード                 | 利用者に見せる文字を、カスタム表示ラベルを使わずに直に書いていないか（翻訳できない）         | ○    | ○   | ○    |                  | LWC のテンプレートの文字、Apex の `addError`・`AuraHandledException` の文字列、Flow の画面の文字                                     | 「利用者に見せる文字」の場所の表（テンプレートの文字・`label` 属性・`ShowToastEvent` の `title` など）                                                             | `code.hardcodedText`                 | 低   |
| 結合度（fan-in・fan-out・不安定さ）      | 変更の影響が広がりやすいクラス・コンポーネント                                               | ○    | ○   | ○    |                  | 依存関係のグラフ（単位の細かさ）                                                                                                     | 単位ごとの入る辺・出る辺の数と不安定さ（Ce / (Ca + Ce)）。`architecture.layers`（G-11）の前段                                                                      | `dependency.coupling`                | 中   |
| コードの重複                             | 似た処理のコピー（まとめる候補）                                                             | ○    | ○   | ○    |                  | 構造の JSON（名前を除いた形）                                                                                                        | 文・ブロックの正規化したハッシュで同じ形を探す（変数名・定数を伏せる）。Flow は要素の並びの形                                                                      | `code.clones`                        | 低   |
| 変更からのテストの選び方                 | 変わったものに届くテストだけを選ぶ（`RunSpecifiedTests` に渡す一覧）                         | ○    |     | ○    |                  | `apex.tests`、`apex.impact`（G-7）、保存の連鎖（上）                                                                                 | 変わった Flow・項目から、DML で動く経路で届くテストも選ぶ                                                                                                          | `change.testSelection`               | 中   |
| デプロイの順                             | 依存の順にどの順でデプロイすればよいか                                                       | ○    | ○   | ○    | すべて           | `processor/dependency/graph.ts` の `getDeploymentOrder`・`toPackageXml`（provider がない）                                           | なし（provider にするだけ。循環は `dependency.cycles` で示す）                                                                                                     | `dependency.deploymentOrder`         | 低   |
| API の版の分布                           | 古い API の版のままの単位（版で動きが変わるもの）                                            | ○    | ○   | ○    | すべて           | `-meta.xml` の `apiVersion`（`lwc.components` は列に持つ）                                                                           | Apex・Flow・Aura・Visualforce の `apiVersion` を同じ列に集める                                                                                                     | `metadata.apiVersions`               | 低   |
| トリガーの作りの決まり                   | 1 オブジェクトに複数のトリガー、トリガーの本体に処理を直書き、混合 DML                       | ○    |     | ○    | 設定オブジェクト | `automation.byObject`、トリガーの本体の文の数、DML の対象                                                                            | 設定オブジェクト（User・Group など）と一般のオブジェクトの分類（混合 DML）                                                                                         | 指摘（`apex.findings` のルール）     | 中   |

**進め方の考え**: 「保存の連鎖」「同じ項目への書き込みの重なり」は、Flow の解析（I-1）ができればすぐ作れて、Apex と Flow をまたぐこの解析ならではの結果になります。「デプロイの順」「API の版の分布」は解析が要らないので、手が空いたときにすぐ足せます。作り方は `docs/plan-details.md` の I-5 です。

### 6.5 そのほかの候補（すべて含める。2026-11-27 決定）

考えられるものをすべて並べ、すべて計画に含めると決めました（2026-11-27。6.4 も同じ）。10 章にすでにある項目は「10 章にあり」と書いています（重ねて足していません）。優先は仮のもので、高から作ります。

**制約**: リポジトリのメタデータだけでは分からないもの（権限セットの割り当て・レコードの件数・実際の実行の記録）は、組織のデータを読む仕組みがないと作れません。その候補は「組織のデータが要る」と書いています。

#### 6.5.1 権限・共有のモデル

| 手法                   | 問い                                                                                                                                                                                | 使う解析（今あるもの）                                                                  | 足りない解析                                                                             | provider（案）                     | 優先 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- | ---- |
| 強い権限               | 「すべてのデータの編集・参照」「ModifyAll / ViewAll」「Apex の作成」「アプリケーションのカスタマイズ」「データの書き出し」などを持つもの                                            | 権限の解析（`processor/Metadata/permissionAnalysis.ts`）、`permission.effective`        | 強い権限の表（システム権限の名前と危険の度合い。`docs/reference/` に出典）               | `permission.highRisk`              | 高   |
| 権限の重なり・包含     | 同じ権限を持つ権限セット、ほかの権限セットに含まれてしまう権限セット                                                                                                                | 権限の解析                                                                              | 権限の集合の比較（包含・一致・ほぼ一致）                                                 | `permission.redundancy`            | 中   |
| 使われない権限セット   | どの権限セットグループにも入らず、どこからも参照されない権限セット                                                                                                                  | 依存関係のグラフ                                                                        | 利用者への割り当ては組織のデータが要る（リポジトリの範囲では「グループに入らない」まで） | `permission.unused`                | 低   |
| 共有のモデル           | オブジェクトの既定の公開範囲（内部・外部）、共有ルール（所有者・条件）、主従関係で親に従う共有、ロールの階層を使うか                                                                | オブジェクトの定義（`sharingModel`・`externalSharingModel`）、共有ルールのメタデータ    | 共有ルールの条件の項目の参照、オブジェクトごとの「誰が見られるか」の要約                 | `sharing.model`                    | 高   |
| 機密の項目の露出       | 機密の分類（`securityClassification`・`complianceGroup`）の項目に、参照・編集の権限を与えている権限セット、それを読む Apex・LWC・Flow                                               | 項目の定義（10 章「項目の属性の残り」で読む）、`permission.fieldAccess`、データアクセス | 項目の属性の読み取り（10 章にあり）と、権限・データアクセスとの突き合わせ                | `permission.sensitiveFields`       | 中   |
| カスタム権限の使用箇所 | カスタム権限を、コード（`FeatureManagement.checkPermission`）・数式（`$Permission`）・Flow・LWC（`@salesforce/customPermission`）のどこで確かめているか、確かめていないカスタム権限 | 依存関係のグラフ（`customPermission` の参照）                                           | Apex の `checkPermission('名前')` の文字列を参照にする（`namedReferences.ts` に足す）    | `permission.customPermissionUsage` | 中   |
| ゲストユーザーへの露出 | Experience Cloud のゲストのプロファイルが使える Apex クラス・オブジェクト、ゲストから呼べる `@AuraEnabled`                                                                          | `permission.apexAccess`・`objectAccess`、`apex.entryPoints`                             | サイト・ゲストのプロファイルの対応（`CustomSite`・`Network` のメタデータ）               | `security.guestExposure`           | 中   |

#### 6.5.2 セキュリティの残り

| 手法                   | 問い                                                                                                  | 使う解析（今あるもの）                                           | 足りない解析                                                                                                         | provider（案）                    | 優先 |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---- |
| XSS                    | LWC の `innerHTML`・`lwc:dom="manual"`、Visualforce の `escape="false"`、Aura の `aura:unescapedHtml` | `calls.ts` の `callType: 'innerHTML'`、LWC のテンプレートの JSON | Visualforce・Aura のマークアップの属性の走査（`processor/Metadata/markup.ts` を広げる）                              | `security.xss`                    | 中   |
| SOQL インジェクション  | 外部入力から動的 SOQL の文字列への経路                                                                | 動的クエリの復元（`dynamicQuery.ts`）                            | テイント解析（10 章にあり）。手前の段として「復元できない動的 SOQL で、`String.escapeSingleQuotes` を通らない穴」    | `security.soqlInjection`          | 中   |
| 機微な情報のログ       | `System.debug` にパスワード・トークン・個人情報らしき値を渡しているところ                             | 事実の `debug`、値の解析                                         | 「機微らしい」の判定（変数・項目の名前の表、機密の分類の項目）                                                       | `security.sensitiveLogging`       | 中   |
| 秘密情報のハードコード | パスワード・API キー・トークンを文字列の定数で書いていないか                                          | 値の解析の定数、`code.hardcoded`（6.4）                          | 秘密らしい値の判定（変数名・長さ・文字の種類）                                                                       | `code.hardcoded` の種類に足す     | 中   |
| 共有を無視する入口     | `without sharing`（または宣言なし）のクラスの `@AuraEnabled`・REST・`@InvocableMethod`                | `apex.entryPoints`、`apexSecurityChecksOf` の `sharing`          | なし（2 つを突き合わせるだけ）                                                                                       | `apex.entryPoints` の列 `sharing` | 高   |
| 外部への接続の許可     | リモートサイトの設定・CSP の信頼済みサイト・指定ログイン情報の一覧と、使っているところ                | 依存関係のグラフ（一部）                                         | `RemoteSiteSetting`・`CspTrustedSite`・`NamedCredential` と callout の宛先（6.4 `integration.callouts`）の突き合わせ | `integration.endpoints`           | 低   |
| 弱い暗号・乱数         | `Crypto.generateDigest('MD5')`・`'SHA1'`、`Math.random` を秘密に使う                                  | 呼び出しの解決、値の解析の定数                                   | 弱いアルゴリズムの表                                                                                                 | 指摘（`apex.findings` のルール）  | 低   |
| 開いたリダイレクト     | 利用者の入力（`ApexPages.currentPage().getParameters()`）をそのまま `PageReference` に渡す            | 値の解析                                                         | テイント解析（10 章にあり）                                                                                          | 指摘                              | 低   |

#### 6.5.3 テストの質

| 手法                       | 問い                                                                                                      | 使う解析（今あるもの）                                 | 足りない解析                                                                 | provider（案）          | 優先 |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------- | ---- |
| テストの質の数             | テストメソッドごとの assert の数、assert のないテスト、`Test.startTest` / `stopTest` の有無、`@TestSetup` | 事実の `assert`（`semantic/facts.ts`）、呼び出しの解決 | テストメソッドごとの集計（呼んだ先の assert も数えるか）                     | `apex.testQuality`      | 高   |
| 本番のコードのテストの分岐 | 本番のコードの `Test.isRunningTest()`                                                                     | 呼び出しの解決                                         | なし                                                                         | 指摘                    | 中   |
| まとめて処理するテスト     | 200 件以上のレコードで動かすテストがあるか（トリガーのまとめ処理の確かめ）                                | 値の解析（ループの回数の定数）、DML の事実             | ループの回数の上限の推定                                                     | `apex.testQuality` の列 | 低   |
| テストデータの作り方       | テストデータの共通の作り手（Factory）を使っているか、テストの中の Id の直書き                             | 呼び出しグラフ、値の解析                               | 「Factory らしい」の判定（名前・`@IsTest` の公開クラス）                     | `apex.testQuality` の列 | 低   |
| 届く行の見積もり           | テストから呼び出しグラフで届くメソッドの文の数 ÷ 全体の文の数（実行しない、静的な見積もり）               | `apex.tests`、`apex.metrics` の文の数                  | 分岐の中は届くとみなす近似。実際の網羅率（組織のデータが要る）とは違うと明記 | `apex.coverageEstimate` | 中   |

#### 6.5.4 組織の上限とデータモデル

| 手法                             | 問い                                                                                                        | 使う解析（今あるもの）                            | 足りない解析                                                                       | provider（案）            | 優先 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------- | ---- |
| 上限への近さ                     | オブジェクトごとの項目の数（型ごと）、参照関係（40）、主従関係（2）、積み上げ集計（25）、項目履歴（20）など | `object.fields`                                   | 上限の表（版・エディションで変わる。`docs/reference/` に出典）                     | `object.limits`           | 中   |
| 使われない項目                   | オブジェクトの側から見た、どこからも参照されない項目（レイアウトにだけあるものは分けて）                    | `dependency.unused`、依存関係のグラフ             | 項目の細かさで、参照の種類（コード・Flow・数式・レイアウト・レポート）ごとに分ける | `object.unusedFields`     | 高   |
| 管理パッケージへの依存           | 管理パッケージ（名前空間）の何に、どこから依存しているか                                                    | グラフの `origin: managed`                        | なし（集計だけ）                                                                   | `dependency.managed`      | 中   |
| データモデルの形                 | どこともつながらないオブジェクト、長い参照の連なり、多態の参照（`WhatId`・`WhoId`）の使い方                 | `object.diagram`、依存関係のグラフ                | 関係のグラフの最長の経路・孤立の判定                                               | `object.modelShape`       | 低   |
| 選択リスト・レコードタイプの多さ | 値の多い選択リスト、使われない値、無効の値を参照するもの                                                    | `object.picklists`、`object.picklistUsage`（6.4） | 無効の値の参照の判定                                                               | `object.picklists` の列   | 低   |
| 数式のコンパイルの大きさ         | 数式の項目が、参照する数式も含めた大きさの上限に近いか                                                      | 数式の参照（`dependency/formula.ts`）             | 参照の数式を展開した文字の数の見積もり                                             | `object.formulaSize`      | 低   |
| 項目の型の変更のリスク           | 比べたときに型が変わった項目と、それを使うコード・Flow・数式                                                | 構造の Diff、依存関係のグラフ                     | なし（`dependency.impact` の項目の細かさ版）                                       | `object.fieldTypeChanges` | 中   |

#### 6.5.5 コードの品質・保守

| 手法                             | 問い                                                                                 | 対象            | 使う解析（今あるもの）                                        | 足りない解析                                            | provider（案）               | 優先 |
| -------------------------------- | ------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------- | ---- |
| 非推奨の API                     | 非推奨の標準クラス・メソッド・LWC の書き方（`if:true` → `lwc:if`）・古い Aura の機能 | Apex・LWC・Aura | 標準型の表（`semantic/standardTypes.ts`）、LWC のテンプレート | 非推奨の印（10 章「標準 API の調査の残り」で集める）    | `code.deprecated`            | 中   |
| 使われない変数・引数・private    | 読まれないローカル変数・引数・private のフィールド・LWC の使われない import          | Apex・LWC       | 値の解析（`dataflow.ts`）、LWC の import の表                 | フィールドの読み書き（10 章「メンバーと参照型」）       | `code.unusedSymbols`         | 中   |
| 例外の握りつぶし                 | 空の `catch`、`catch` で `System.debug` だけ                                         | Apex・LWC       | 文の JSON                                                     | なし                                                    | 指摘                         | 中   |
| 残したデバッグ                   | 本番のコードの `System.debug`・`console.log`                                         | Apex・LWC       | 事実の `debug`、LWC の呼び出し                                | LWC の `console.*` を呼び出しに足す                     | 指摘                         | 低   |
| 大きすぎるクラス・長い引数       | メソッドの数・フィールドの数・行数・引数の数の多いもの                               | Apex・LWC       | `apex.outline`、`apex.metrics`                                | クラスの細かさのメトリクス（メンバーの数・凝集度 LCOM） | `apex.classMetrics`          | 中   |
| 文書化の網羅                     | ApexDoc・JSDoc のない公開メソッド・`@api`                                            | Apex・LWC       | `apex.interface`・`lwc.interface`                             | コメントの JSON（今はコメントを持つか確かめる）         | `code.documentation`         | 低   |
| 命名規約                         | クラス・メソッド・変数・項目・Flow の名前の決まり                                    | すべて          | 定義の一覧（`apex.symbols`（G-5））                           | 規約の設定（B-6 の設定ファイル）                        | `code.naming`                | 低   |
| TODO・FIXME                      | コメントの TODO・FIXME・HACK の一覧                                                  | Apex・LWC       | ソースの文字                                                  | コメントの位置                                          | `code.todos`                 | 低   |
| まとめ処理になっていないトリガー | `Trigger.new[0]` だけを使う、ループの外で 1 件だけ処理する                           | Apex            | 値の解析、トリガーの文脈の事実（`triggerContexts`）           | 添字の定数の判定                                        | 指摘                         | 高   |
| ループの中の重い呼び出し         | ループの中の `Schema.getGlobalDescribe`・describe・`JSON.serialize` の大きなもの     | Apex            | `apexLoopOperationsOf`                                        | 重い呼び出しの表                                        | `apex.loopOperations` の種類 | 中   |
| 深い入れ子のループ               | 入れ子のループ（CPU 時間）                                                           | Apex・LWC・Flow | メトリクスの `maxNesting`                                     | ループだけの入れ子の深さ                                | メトリクスの列               | 低   |

#### 6.5.6 LWC・画面

| 手法                 | 問い                                                                                       | 使う解析（今あるもの）                              | 足りない解析                            | provider（案）         | 優先 |
| -------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------- | --------------------------------------- | ---------------------- | ---- |
| アクセシビリティ     | `img` の `alt`、ボタン・入力の `label`、`aria-*`、アイコンだけのボタンの代替の文字         | LWC のテンプレートの JSON、基本の部品の属性表       | 規則の表（WCAG のうち静的に分かるもの） | `lwc.accessibility`    | 中   |
| テンプレートの決まり | `for:each` の `key` がない、`if:true` / `if:false`（非推奨）、使われない `lwc:ref`         | LWC のテンプレートの JSON                           | なし                                    | 指摘（`lwc.findings`） | 中   |
| LWS・Locker との相性 | `window`・`document` への直の書き込み、`eval`・`Function`、ほかの名前空間の DOM への手出し | LWC の呼び出しの解析                                | 禁止・注意の API の表                   | 指摘（`lwc.findings`） | 低   |
| SLDS・スタイル       | CSS の色・余白の直書き（デザイントークンを使わない）、SLDS のクラスの誤り                  | LWC のスタイルシートの JSON（`stylesheet.ts`）      | トークン・SLDS のクラスの表             | `lwc.styles`           | 低   |
| `@wire` の使い方     | 同じデータを複数の `@wire` で取る、`refreshApex` を呼ばない更新、cacheable でない wire     | `lwc.apexCalls`（G-5）、LWC の呼び出し              | 更新のあとの `refreshApex` の有無の判定 | `lwc.apexCalls` の列   | 中   |
| 画面の重さ           | 1 画面（Lightning ページ）に置いた部品の数、その部品の `@wire`・Apex の呼び出しの合計      | `flexiPage.detail`、`lwc.placements`、`lwc.metrics` | ページ → 部品 → 呼び出しの集計          | `page.load`            | 低   |

#### 6.5.7 メタデータの種類の残り

| 手法                                     | 問い                                                                                          | 使う解析（今あるもの）                 | 足りない解析                                                                                                 | provider（案）              | 優先 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------- | ---- |
| 古い自動化の移行の候補                   | ワークフロールール・プロセスビルダーの一覧と、Flow に移すときの中身（条件・アクション）       | `automation.byObject`、Flow の解析     | ワークフロールールの条件・アクション（10 章「自動化の中身」にあり）、プロセスビルダーの判定（`processType`） | `automation.legacy`         | 高   |
| レポート・ダッシュボード                 | レポートの種類・列・条件の項目、ダッシュボード → レポート、使われない項目との関係             | 参照の一部                             | レポート・ダッシュボードの構造の読み取り（10 章「Flow などの参照の残り」にレポートタイプの一部あり）         | `analytics.reports`         | 中   |
| メールテンプレート                       | 差し込みの項目・Visualforce・Lightning のテンプレート                                         | 参照の一部                             | 10 章「メールテンプレートの参照の残り」にあり                                                                | `email.templates`           | 低   |
| カスタムメタデータのレコード             | カスタムメタデータ型のレコードが文字列で持つクラス名・項目名・Flow 名（設定で切り替える処理） | カスタムメタデータのレコードの読み取り | 値の中の名前を参照にする（どの項目が名前かの推定、または設定ファイルで指定）                                 | `customMetadata.references` | 中   |
| プラットフォームイベント                 | イベントの発行者（Apex・Flow）と購読者（トリガー・Flow・LWC の empApi）の対応                 | 事実の `publish`、Flow の起動          | 購読の側の読み取り（イベントのトリガー・`lightning/empApi`）                                                 | `event.flow`                | 中   |
| 静的リソース                             | 大きさ・種類・使われていないもの                                                              | 依存関係のグラフ                       | ファイルの大きさ                                                                                             | `staticResource.usage`      | 低   |
| クイックアクション・グローバルアクション | 対象・項目・置き場所                                                                          | 参照の一部                             | アクションの構造の読み取り                                                                                   | `action.list`               | 低   |
| Experience Cloud                         | サイト・ページ・ゲストの設定                                                                  | なし                                   | `ExperienceBundle`・`Network`・`CustomSite` の読み取り                                                       | `site.detail`               | 低   |
| Aura・Visualforce                        | 構造・処理フロー・メトリクス                                                                  | 参照の一部                             | 10 章「Aura の参照」「Visualforce・Aura の専用の解析」にあり                                                 | （10 章にあり）             | —    |

#### 6.5.8 変更・運用

| 手法                     | 問い                                                                                            | 使う解析（今あるもの）                                     | 足りない解析                                                                         | provider（案）               | 優先 |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------- | ---- |
| 互換性を壊す変更         | 公開 API（`global`・`@AuraEnabled`・`@api`・Flow の入力・出力の変数）の削除・型の変更と、使う側 | `apex.interface`・`lwc.interface`・`flow.interface` の比較 | 3 つをまとめて「壊す変更」と判定（`lwc.publicApiChanges` は 10 章にあり）            | `change.breaking`            | 高   |
| 削除のマニフェスト       | 比べたときに消えた単位から `destructiveChanges.xml`                                             | 構造の Diff、`toPackageXml`（`graph.ts`）                  | なし                                                                                 | `change.destructiveManifest` | 中   |
| パッケージのマニフェスト | 選んだ単位（機能のまとまり・変わったもの）の `package.xml`                                      | `toPackageXml`、`feature.scope`                            | なし（provider にするだけ）                                                          | `change.packageManifest`     | 中   |
| デプロイのリスク         | 変わった単位ごとの、影響の広さ × テストの有無 × 複雑度の点数                                    | `dependency.impact`、`apex.tests`、`apex.metrics`          | 点数の決め方（設定で重みを変えられる）                                               | `change.risk`                | 中   |
| リリースノート           | 変わったものの要約（種類ごとの追加・削除・変更と、利用者に見える変化）                          | 構造の Diff、`change.summary`（10 章にあり）               | 利用者に見える変化の判定（画面・項目・ラベル）                                       | （10 章にあり）              | —    |
| 担当と変更頻度           | git の変更頻度・同時変更・最後に変えた人                                                        | なし                                                       | git の履歴の読み取り（10 章にあり。G-11）                                            | （10 章にあり）              | —    |
| 組織との差               | リポジトリと実際の組織の差（組織にだけあるもの）                                                | なし                                                       | 組織のデータが要る（`sf project retrieve` の結果を before にすれば今の比較でできる） | 文書化だけ                   | 低   |

#### 6.5.9 解析の手法そのもの（10 章にあるもの・ないもの）

| 手法                                 | 状態                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| テイント解析                         | 10 章にあり（低）。6.5.2 の SOQL インジェクション・開いたリダイレクトの土台                                           |
| パスを区別する解析（null 安全）      | 10 章にあり（低）。null の参照の可能性（`x.y` の前に `x != null` がない）の指摘の土台                                 |
| プログラムスライシング               | 10 章にあり（低。G-11 の `apex.slice`）                                                                               |
| 支配関係・制御依存                   | 10 章にあり（低）                                                                                                     |
| SSA・記号実行                        | 10 章にあり（使うかを決める）                                                                                         |
| 名前の変更の推定                     | 10 章にあり（低）                                                                                                     |
| メソッド間の要約                     | 10 章にあり（低）。6.4 の例外の伝わり方・ガバナ制限の見積もりの精度を上げる                                           |
| 型の推論（LWC の TS・JS）            | 10 章にあり（低）                                                                                                     |
| ループの回数の推定（区間解析）       | **なし**。まとめ処理のテスト（6.5.3）・ガバナ制限の見積もりの精度を上げる                                             |
| 文字列の値の集合（定数の伝播の拡張） | **なし**。今は 1 つの定数か unknown。分岐ごとの値の集合（`'A' \| 'B'`）を持てば、動的 SOQL の対象が複数のときも拾える |
| コレクションの中身の追跡             | **なし**。`List<SObject>` に何のオブジェクトが入るか（DML の対象の型の精度）                                          |
