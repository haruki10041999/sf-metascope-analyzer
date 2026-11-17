# レポート用コンポーネントと解析の方針（計画）

このリポジトリは **表示用コンポーネント** と、コンポーネントに渡す **データを作る解析** だけを持つ。どのコンポーネントをどこに置き、何を説明するかは **skill 側** が決める。

- skill はレポートの **フォーマット（レポート仕様）** を書く。CRM の画面定義のように、どのセクションにどのコンポーネントを置き、どのデータを渡すかを並べる。
- AI が考えるのは、文章（要約・リスクの説明・レビューの指摘）と、どのデータを見せるかの選択だけにする。数値・一覧・図はすべて解析の結果をそのまま使い、AI には書かせない。

この文書は計画であり、まだ実装していないものを含む。状態は各表の「状態」列に書く。解析木（JSON）をまだ作れていないメタデータは [analysis-plan.md](./analysis-plan.md)。

（2026-11-17 時点）: 仕組み（レポートの文書・検証・カタログ・ビルド・viewer・MCP のツール）は [implementation-roadmap.md](./implementation-roadmap.md) の R1〜R5 で作った。レポートの文書は 1.1 の案ではなく、json-render の仕様にデータの宣言を足した形（`{ title, diff?, compare?, data, spec }`。[src/report/document.ts](../src/report/document.ts)）にした。部品の名前は 2 章の案と違うものがある（今の部品の一覧は [docs/catalog/report-catalog.md](./catalog/report-catalog.md)）。第一の目的はドキュメントとコードの理解で、差分は補助（既定は今の状態のすべて。差分は `diff` / `compare` のときだけ）。残りの作業は [todo.md](./todo.md) 2 章。

## 1. 全体の形

```text
skill（レポート仕様 + 書き方の指示）
   │  ① データの種類を選ぶ          ② AI が文章を書く
   ▼                                 ▼
MCP ツール ── get_report_data(provider, args) ──▶ 解析（data provider）──▶ 型付きデータ
   │
   └─ build_report(spec) ──▶ 仕様を検証 ──▶ viewer（コンポーネント）──▶ レポート HTML
```

| 層             | 置き場所                                                                                          | 役割                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| レポート仕様   | 利用者・AI が書く（このリポジトリは型・検証・カタログ・雛形を持つ。`src/report/`）                | セクション・コンポーネント・データの参照・AI の文章                                      |
| data provider  | `src/analyzer/report/`（登録表は `registry.ts`）                                                  | 解析結果を、コンポーネントが受け取る型にする。名前（`flow.list` など）で呼べるようにする |
| コンポーネント | `src/viewer/report/`（部品の定義は `src/report/catalog.ts`。ER 図の `viewer/metadata/` は未移行） | 型付きデータと AI の文章を受け取って描くだけ。解析はしない                               |
| ビルド         | `src/builder/reportBuilder.ts`（`htmlBuilder` は消した）                                          | 仕様とデータを、事前にビルドした viewer の 1 つの HTML に埋め込む                        |
| MCP            | `src/mcp/`（`reportTools.ts`・`prompts.ts`・`catalogResources.ts` など）                          | provider の一覧・データの取得・レポートの作成を公開する                                  |

### 1.1 レポート仕様の形（案）

（2026-11-17 時点）: 下は最初の案。実際の形は json-render の仕様（`root` と平らな `elements`）に `data`（名前 → provider と引数）を足したもので、部品の行は `{ "$state": "/data/<名前>" }` で指す（[src/report/document.ts](../src/report/document.ts)・[docs/examples/report/](./examples/report/README.md)）。範囲は `scope` ではなく `diff` / `compare`。`annotations` は未実装（対象の書き方は 5 章で決めた）。

```jsonc
{
    "title": "リリース前レビュー: feature/invoice",
    "scope": { "git": { "mode": "committed", "from": "main", "mergeBase": true } },
    "sections": [
        {
            "title": "概要",
            "blocks": [
                { "component": "Narrative", "text": "（AI が書く要約）" },
                { "component": "SummaryCards", "data": { "provider": "change.summary" } },
            ],
        },
        {
            "title": "オブジェクトの変更",
            "blocks": [
                {
                    "component": "FieldDiffTable",
                    "data": {
                        "provider": "object.fieldDiffs",
                        "params": { "objects": ["Invoice__c"] },
                    },
                    "annotations": [
                        {
                            "target": "Invoice__c.Amount__c",
                            "severity": "warning",
                            "text": "（AI の指摘）",
                        },
                    ],
                },
            ],
        },
    ],
}
```

- `data` は provider の名前と引数だけを書く。データ本体はビルド時に解析から取る（AI が数値を書き換えられないようにする）。
- `annotations` は、データの行（`target` は API 名やソースの位置）に AI の注記を付ける。対象が存在しなければビルドでエラーにする。
- 仕様は JSON Schema（コンポーネントごとに受け取れる provider を限定）で検証する。skill にはこのスキーマとコンポーネントのカタログを渡す。

## 2. コンポーネントの一覧

優先度: **A** = 最初に作る、**B** = 次に作る、**C** = 後で作る。「データ」列は元の解析の状態（済（provider）= provider まで実装済みで登録表にある、済 = 解析・Diff は実装済みで provider は未、未 = 解析が未実装、木なし = 解析木（JSON）も未。[analysis-plan.md](./analysis-plan.md)）。

（2026-11-17 時点）: 部品は、案の名前ごとに作らず、汎用の部品で描く形にした。行のデータ（rows）は `DataTable`・`StatusSummary`、行列（matrix）は `Matrix`、Flow の図は `FlowDiagram`、依存関係の図は `DiagramText`、レイアウト・Lightning ページ・自動化・変更の影響は `LayoutView`・`FlexiPageView`・`AutomationView`・`ImpactView`。provider が登録表にあれば、その部品でもう描ける。優先度は目的（ドキュメント・理解が第一）に合わせて [todo.md](./todo.md) 2 章で並べ直した。

### 2.1 汎用

| コンポーネント                 | 用途                                                     | 受け取るデータ                              | 優先度 | 状態                                                                    |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `Section` / `Tabs`             | レポートの骨組み                                         | 仕様のセクション                            | A      | 済（shadcn の `Card`・`Tabs`・`Stack` など）                            |
| `Narrative`                    | AI の文章（Markdown）                                    | 文字列                                      | A      | 済                                                                      |
| `Callout`                      | 注意・リスク・推奨（severity 付き）                      | `{ severity, title, text, targets? }`       | A      | 済（shadcn の `Alert`）                                                 |
| `SummaryCards`                 | 件数の要約（追加 3・変更 5…）                            | `{ label, value, status? }[]`               | A      | 済（`StatusSummary`）                                                   |
| `DataTable`                    | 一覧（並べ替え・絞り込み・status の色分け）              | 列定義 + 行                                 | A      | 済（`onlyChanged`・`showSource`）                                       |
| `StatusBadge` / `StatusLegend` | added / removed / changed / unchanged の表示             | status                                      | A      | 済（status の名前と色は `components/status.tsx` の 1 か所）             |
| `SourceSnippet`                | ソース・XML の抜粋（行番号、before / after の並列表示）  | `SourceSpan`（`findNodeSourceInfo` の結果） | A      | 一部（`DataTable` の `showSource`。before / after の並列は未）          |
| `DiffTree`                     | 差分の木（`run-diff.ts` の summary.md を画面にしたもの） | `*JsonDiff` / `GumTreeDiff`                 | B      | 未（文字版は各 `run-diff.ts`）                                          |
| `Graph`                        | ノードとエッジの図（dagre で自動配置）                   | `{ nodes, edges }`                          | B      | 一部（`FlowDiagram`。オブジェクトの ER 図は `viewer/metadata/` のまま） |
| `Matrix`                       | 行 × 列の対応表（○ / R / W など）                        | `{ rows, columns, cells }`                  | B      | 済                                                                      |

### 2.2 オブジェクト

| コンポーネント             | 用途                                           | provider                                                 | 優先度 | データ                                                                                                                            |
| -------------------------- | ---------------------------------------------- | -------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `ObjectGraph`              | ER 図（参照関係、差分の色分け）                | `object.diagram`（案は `object.dependencies`）           | A      | 済（provider・部品 `ObjectDiagram`。2026-11-17。古い `viewer/metadata` は消した）                                                 |
| `ObjectDetail`             | 1 オブジェクトの項目一覧・設定値               | `object.list`・`object.fields`（案は `object.detail`）   | A      | 済（provider。`DataTable` で描く）                                                                                                |
| `FieldDiffTable`           | 項目の追加・削除・属性の変更（before → after） | `object.fields` を `diff` で（案は `object.fieldDiffs`） | A      | 済（provider。変わったプロパティの名前・選択リスト値の並び順の変化）                                                              |
| `PicklistTable`            | 選択リスト値（有効・既定・色、差分）           | `object.picklists`                                       | B      | 済（provider。定義の順）                                                                                                          |
| `ValidationRuleList`       | 入力規則（数式・メッセージ・有効、差分）       | `object.validationRules`                                 | B      | 済（provider。条件は数式の文字列）                                                                                                |
| `RecordTypeMatrix`         | レコードタイプ × 選択リスト値                  | `object.recordTypePicklists`                             | C      | 済（provider。行の形）                                                                                                            |
| `TranslationCoverageTable` | 言語ごとの翻訳の有無・未翻訳・古い翻訳         | `translation.coverage`                                   | B      | 済（provider。2026-11-17。`translation.coverage`（件数と割合）・`translation.items`（項目ごと。状態で絞る）。既定はすべての言語） |
| `TranslationDiffTable`     | 翻訳の変更（ラベル・ヘルプ・選択リスト値）     | `translation.diffs`                                      | C      | 済                                                                                                                                |

### 2.3 Apex

| コンポーネント         | 用途                                                                                                 | provider                 | 優先度 | データ                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| `ApexDiffView`         | 単位（クラス・トリガー・匿名 Apex）ごとの宣言・文の差分と -meta.xml（`SourceSnippet` と `DiffTree`） | `apex.diffs`             | A      | 済（`makeApexUnitDiffs`）                                                                          |
| `ApexMetaTable`        | API バージョン・status・パッケージ（差分付き）                                                       | `apex.meta`              | B      | 済                                                                                                 |
| `ClassOutline`         | クラスのメンバー（メソッド・項目・修飾子・アノテーション）                                           | `apex.outline`           | A      | 済（provider。2026-11-17。private・テストも含む。トリガーは対象とイベント）                        |
| `SoqlDmlTable`         | どこで何の SOQL / DML を実行しているか（オブジェクト・項目・ループ内か）                             | `apex.dataAccess`        | A      | 済（provider。2026-11-17。クエリが読む項目・DML の対象と同じメソッドで代入する項目・ループの中か） |
| `CallGraph`            | メソッドの呼び出し関係                                                                               | `apex.callGraph`         | B      | 未（同 4・5 章）                                                                                   |
| `ClassDependencyGraph` | クラス間の依存（extends / implements / 型の参照 / new）                                              | `apex.classDependencies` | B      | 未                                                                                                 |
| `FindingsList`         | ルール違反の候補（ループ内 SOQL・ハードコード ID など）                                              | `apex.findings`          | B      | 未（同 2 章）                                                                                      |
| `MetricsTable`         | メソッドごとの行数・ネスト・分岐数など                                                               | `apex.metrics`           | C      | 未                                                                                                 |

### 2.4 LWC

| コンポーネント         | 用途                                                                                                                | provider               | 優先度 | データ                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `LwcComponentList`     | コンポーネントの一覧（公開先 `targets`、`isExposed`、API バージョン、JS / TS、読めなかったファイル）                | `lwc.components`       | A      | 済（provider。2026-11-17。`lwc.components`）                                                                                        |
| `LwcComponentDetail`   | 1 コンポーネントの `@api`（型）、`@wire`、発行するイベント、テンプレート・CSS                                       | `lwc.detail`           | A      | 済（provider。2026-11-17。`lwc.detail`）                                                                                            |
| `LwcDiffView`          | バンドルごとの差分（JS / TS のメンバー、テンプレートの要素の木、CSS の規則、js-meta.xml）                           | `lwc.diffs`            | A      | 済（`makeLwcBundleDiffs`）                                                                                                          |
| `LwcFindingsList`      | 仕様違反（resolvedError）、テンプレートと JS の食い違い、子コンポーネントとの食い違い、カタログにない `lightning-*` | `lwc.findings`         | A      | 済（`resolvedError` と `analyzeLwcBundles` の `findings`）                                                                          |
| `ComponentTree`        | 親子関係（`c-*` / `lightning-*`）とイベントの流れ（子の `CustomEvent` → 親の `on*`）                                | `lwc.componentTree`    | B      | 済（`localComponents`・`component.events`）                                                                                         |
| `LwcFieldUsageTable`   | 参照するオブジェクト・項目（`@salesforce/schema`、`lightning-record-*-form` の `field-name`）                       | `lwc.fieldUsage`       | B      | 済（`metadataDependencies`）                                                                                                        |
| `LwcApexCallTable`     | 呼ぶ Apex（`@wire` / imperative、`$` のリアクティブな参照）                                                         | `lwc.apexCalls`        | B      | 済（`lwcImport.apex`・解析の呼び出し（`analyzeLwcModuleCalls`）・`lwcWireConfig`）。provider は未登録。戻り値の型は Apex の解析待ち |
| `LwcPublicApiTable`    | 公開 API の変更（`@api`・イベントの追加・削除）と、それを使う親コンポーネント                                       | `lwc.publicApiChanges` | B      | 済（Diff と `analyzeLwcBundles` を組み合わせる）                                                                                    |
| `LwcTargetConfigTable` | 配置先ごとの設定プロパティ（`targetConfigs`）                                                                       | `lwc.targetConfigs`    | C      | 済                                                                                                                                  |
| `LwcStylingHooksTable` | 使っている・定義しているカスタムプロパティ（`--lwc-*` / `--slds-*`）                                                | `lwc.stylingHooks`     | C      | 済（CSS の宣言の `uses` / `defines`）                                                                                               |
| `LwcWireframe`         | テンプレートの構造の画面モック（分岐はタブ、繰り返しは 1 件分）                                                     | `lwc.wireframe`        | B      | 済（provider・部品 `LwcWireframe`。2026-11-17。[lwc-snapshot-plan.md](./lwc-snapshot-plan.md) の方式 A）                            |
| `LwcSnapshot`          | 状態ごとの画面モック（`@lwc/engine-server` の SSR）                                                                 | `lwc.snapshot`         | C      | 未（試作で描画を確認。[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)）                                                              |

### 2.5 権限（Profile / PermissionSet / PermissionSetGroup）

| コンポーネント         | 用途                                                                                   | provider                  | 優先度 | データ         |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------- | ------ | -------------- |
| `PermissionDiffTable`  | 権限セット・プロファイルの変更（オブジェクト・項目・Apex・カスタム権限・システム権限） | `permission.diffs`        | A      | 済（provider） |
| `ObjectAccessMatrix`   | 権限セット・プロファイル × オブジェクトの CRUD                                         | `permission.objectAccess` | A      | 済（provider） |
| `FieldAccessMatrix`    | 権限セット・プロファイル × 項目の参照・編集（変更した項目に絞れる）                    | `permission.fieldAccess`  | A      | 済（provider） |
| `ApexAccessTable`      | Apex クラス・Visualforce の実行権限                                                    | `permission.apexAccess`   | B      | 済（provider） |
| `EffectivePermissions` | 権限セットグループ（ミュートを含む）を合わせた、実際に与える権限                       | `permission.effective`    | B      | 済（provider） |

### 2.6 自動化（Flow）

| コンポーネント       | 用途                                                                                    | provider              | 優先度 | データ                                               |
| -------------------- | --------------------------------------------------------------------------------------- | --------------------- | ------ | ---------------------------------------------------- |
| `FlowList`           | Flow の一覧（種類・起動条件・対象オブジェクト・有効なバージョン）                       | `flow.list`           | A      | 済（provider）                                       |
| `FlowDiagram`        | 要素と接続の図（差分の色分け）。`Graph` を使う                                          | `flow.diagram`        | A      | 済（provider・部品 `FlowDiagram`）                   |
| `FlowDiffView`       | 要素ごとの差分（条件・割り当て・レコードの操作）                                        | `flow.diffs`          | A      | 済（provider）                                       |
| `FlowReferenceTable` | 参照する項目・Apex アクション・サブフロー・画面の LWC                                   | `flow.references`     | B      | 済（provider）                                       |
| `FlowInterfaceTable` | Flow の入力・出力の変数（before を渡すと、増えた・減った・変わった入出力。意味の差分）  | `flow.interface`      | B      | 済（provider。2026-11-16。`onlyChanged` で変化だけ） |
| `TriggerOrderTable`  | オブジェクトごとの自動化（Apex トリガー・レコードトリガーフロー・入力規則）の一覧と順序 | `automation.byObject` | B      | 済（provider・部品 `AutomationView`）                |

### 2.7 画面（Layout / FlexiPage / タブ・アプリ）

| コンポーネント       | 用途                                                                                 | provider           | 優先度 | データ                                                             |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------ | ------ | ------------------------------------------------------------------ |
| `LayoutView`         | ページレイアウトのセクションと項目（必須・参照のみ）、関連リスト、ボタン（差分付き） | `layout.detail`    | B      | 済（provider・部品 `LayoutView`）                                  |
| `FlexiPageView`      | Lightning ページのリージョンと部品（LWC・標準の部品）とプロパティ                    | `flexiPage.detail` | B      | 済（provider・部品 `FlexiPageView`）                               |
| `ComponentPlacement` | LWC がどの Lightning ページ・タブ・クイックアクションに置かれているか                | `lwc.placements`   | B      | 済（provider。Lightning ページのみ。タブ・クイックアクションは未） |
| `AppNavigationTable` | アプリのタブ・ユーティリティ                                                         | `app.navigation`   | C      | 木なし                                                             |

### 2.8 横断・変更範囲

| コンポーネント       | 用途                                                                                                                                                                                                     | provider                                      | 優先度 | データ                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `ChangedFilesTable`  | git の差分の単位の一覧（種類・status）                                                                                                                                                                   | `change.files`                                | A      | 一部（`GitParser` と各 Diff は済。組み立ては未）                                                       |
| `FieldUsageMatrix`   | 項目 × 使う場所（Apex・LWC・Flow・レイアウト・入力規則の数式・権限）                                                                                                                                     | `crossRef.fieldUsage`                         | B      | 一部（LWC は済、Apex・Flow・レイアウト・数式は未）                                                     |
| `LabelUsageTable`    | カスタム表示ラベルの使用箇所（Apex・LWC・Visualforce）と未使用のラベル                                                                                                                                   | `crossRef.labels`                             | C      | 済（provider。LWC・Apex・Flow。Visualforce は未）                                                      |
| `ImpactView`         | 変更した項目・メソッド・LWC の `@api` から影響を受けるもの                                                                                                                                               | `dependency.impact`（案は `impact.byChange`） | C      | 済（provider・部品 `ImpactView`。単位の細かさ。比べる時点が要る）                                      |
| `CodeInterfaceTable` | Apex の外から使えるクラス・メンバー（`global`・`public`・`@AuraEnabled` など）と LWC の親から使えるもの（`@api`・イベント・slot）。before を渡すと、増えた・減った・変わった（引数・型）もの。意味の差分 | `apex.interface` / `lwc.interface`            | B      | 済（provider。2026-11-17。`onlyChanged` で変化だけ。[report/code.ts](../src/analyzer/report/code.ts)） |

## 3. 必要な解析と実装

「状態」は 済 / 一部 / 未。provider は 1.1 の `data.provider` で指定する名前。

### 3.1 前提として直すもの

| 項目                                       | 内容                                                                                                                                                               | 状態                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| レポート HTML へのデータの埋め込み         | `htmlBuilder` の `define` 名、`main.tsx`、`index.html` の名前が食い違っていて、データが空になる（[metadata-implementation.md](./metadata-implementation.md) 9 章） | 解消（`htmlBuilder` ごと消し、`reportBuilder.ts` で作り直した。R1）           |
| 文字列からの parse                         | git の before 側（作業ツリーにない中身）を読むため、ファイルパスではなく中身を渡す入口                                                                             | 済（単位の種類の `parseUnit` が読み込み済みの中身を受け取る。木は `GitTree`） |
| git の範囲からの before / after の組み立て | `GitParser.getDiffFiles` + `readDiffFileContent` で、範囲内の単位（クラス・バンドル・オブジェクトなど）の before / after を parse する                             | 済（`unit/gitRange.ts` の `CompareRange`。文書・ツールの `compare`。R5）      |

### 3.2 data provider（`src/analyzer/report/`）

provider は権限・Flow・画面・ラベル・指摘の一覧・コードの公開の形・依存関係（`src/analyzer/report/`。登録表は `registry.ts` の `PROVIDER_DEFINITIONS`（説明・引数と出力の zod・例）、出力の型は `schemas.ts` から作る）を実装済み。サンプルの出力は [examples/metadata/output/report/](./examples/metadata/README.md)（`run-folders.ts`）。ほかは「元にする解析」の状態を書く。

| provider                                                                                                            | 元にする解析                                                                                                           | 元の状態                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `change.files` / `change.summary`                                                                                   | `GitParser`、`makeApexUnitDiffs`・`makeLwcBundleDiffs`・`makeObjectUnitDiffs`・`makeObjectTranslationUnitDiffs` の件数 | 済（3.1 の組み立ては未）                                                                              |
| `object.dependencies` / `object.detail`                                                                             | `analyzeObject`、`getObjectDependencies`、`view.ts`                                                                    | 済（`view.ts` を provider にする）                                                                    |
| `object.fieldDiffs` / `object.picklists` / `object.validationRules` / `object.recordTypePicklists`                  | `CustomObjectJsonDiff` を表の行にする                                                                                  | 済                                                                                                    |
| `translation.coverage` / `translation.diffs`                                                                        | `analyzeTranslationCoverages`、`makeObjectTranslationUnitDiffs`                                                        | 済                                                                                                    |
| `apex.diffs` / `apex.meta`                                                                                          | `makeApexUnitDiffs`（単位ごとにソースと -meta.xml）                                                                    | 済                                                                                                    |
| `apex.outline` / `apex.dataAccess` / `apex.callGraph` / `apex.classDependencies` / `apex.metrics` / `apex.findings` | [apex-json-analysis.md](./apex-json-analysis.md) の解析                                                                | `apex.outline`・`apex.dataAccess` は済（`src/analyzer/report/apex.ts`）。ほかは未                     |
| `lwc.components` / `lwc.detail` / `lwc.targetConfigs` / `lwc.stylingHooks`                                          | LWC の JSON（`LwcBundleJson`）、`analyzeLwcComponent`                                                                  | 済                                                                                                    |
| `lwc.diffs` / `lwc.publicApiChanges`                                                                                | `makeLwcBundleDiffs`（と `analyzeLwcBundles` の親子関係）                                                              | 済                                                                                                    |
| `lwc.findings` / `lwc.componentTree` / `lwc.fieldUsage` / `lwc.apexCalls`                                           | `resolvedError`、`analyzeLwcBundles`（`findings`・`localComponents`・`metadataDependencies`）、import と `@wire`       | 済（provider は未。Apex の戻り値の型は未）                                                            |
| `lwc.wireframe` / `lwc.snapshot`                                                                                    | テンプレートの JSON、SSR（[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)）                                             | 一部                                                                                                  |
| `permission.*`                                                                                                      | Profile・PermissionSet・PermissionSetGroup の解析木と、権限の計算（[analysis-plan.md](./analysis-plan.md)）            | 済（`src/analyzer/report/permission.ts`）                                                             |
| `flow.*` / `automation.byObject`                                                                                    | Flow の解析木と参照の取り出し                                                                                          | 済（`src/analyzer/report/flow.ts`）                                                                   |
| `layout.detail` / `flexiPage.detail` / `lwc.placements` / `app.navigation`                                          | Layout・FlexiPage・CustomTab・CustomApplication の解析木                                                               | 済（`src/analyzer/report/page.ts`。`app.navigation` は未）                                            |
| `crossRef.fieldUsage` / `crossRef.labels`                                                                           | 各種類の項目・ラベルの参照（Apex の SOQL / DML、LWC の `metadataDependencies`、Flow、レイアウト、数式）                | `crossRef.labels` は済（`src/analyzer/report/crossRef.ts`）。`crossRef.fieldUsage` は一部（LWC のみ） |
| `metadata.findings`                                                                                                 | 権限・ラベル・Flow・画面の解析の指摘（before と比べて、新しく出た・なくなった指摘）                                    | 済（`src/analyzer/report/crossRef.ts`）                                                               |
| `impact.byChange`（今は `dependency.impact`）                                                                       | Diff と参照の組み合わせ                                                                                                | 済（`dependency.impact`。単位の細かさ。項目・メソッドの細かさは未）                                   |

provider は次の規則で作る。

- 入力は parse 結果（before / after）と引数だけ。ファイルを直接読まない（MCP・テスト・サンプルで同じ結果になるように）。
- 出力の各行は、元のノードの `sourceKeys` とファイルのパスを持つ（`SourceSnippet` と AI の注記の対象に使う）。
- 出力の型はコンポーネントの props と同じ型にし、`src/analyzer/report/schemas.ts`（zod）から作る（viewer はこの型だけに依存する）。
- 既定は今の状態のすべてを返す（status なし）。比べる時点（`diff` / `compare`）があれば行に status を付ける。差分だけを返すものは `requiresComparison` にする。

### 3.3 レポート仕様とビルド

| 項目                     | 内容                                                                                                    | 状態                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 仕様の型と JSON Schema   | `ReportSpec`（1.1）。コンポーネントごとに受け取れる provider を決める                                   | 済（`ReportDocument`。部品ごとに受け取れる形・provider は `REPORT_DATA_BINDINGS`。R1・R4） |
| 仕様の検証               | 未知のコンポーネント・provider、引数の型、注記の対象の存在                                              | 済（注記の対象の存在は未。注記が未実装のため）                                             |
| ビルド                   | provider を実行してデータを埋め込み、viewer で描く。今の `Prop`（`type: 'metadata'`）を仕様に置き換える | 済（`reportBuilder.ts`。事前にビルドした viewer に埋め込む）                               |
| コンポーネントのカタログ | skill に渡す、コンポーネント・provider・引数・出力例の一覧（このリポジトリから生成する）                | 済（`llmCatalog.ts`・[docs/catalog/](./catalog/report-catalog.md)・MCP のリソース。R2）    |

### 3.4 MCP ツール

| ツール                                                                   | 内容                                                               | 状態                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `list_report_components` / `describe_report_component`                   | カタログ（3.3）の概要と、部品の詳しい説明                          | 済（2026-11-17。[implementation-roadmap.md](./implementation-roadmap.md) の R3） |
| `list_report_providers` / `describe_report_provider` / `get_report_data` | provider の一覧・説明・型付きデータ（AI が文章を考えるための材料） | 済                                                                               |
| `validate_report_spec` / `build_report`                                  | 仕様を検証して HTML を作る                                         | 済                                                                               |
| `save_objects` / `analyze_objects`                                       | 古いツール                                                         | 消した（`save_baseline` に置き換えた）                                           |

## 4. 進め方（案）

（2026-11-17 時点）: 1・2 は済み（[implementation-roadmap.md](./implementation-roadmap.md) の R1〜R5）。5〜7 の provider と部品も済み。3・4・8 が残り（順番は目的に合わせて [todo.md](./todo.md) 2・3 章で並べ直した）。

1. **前提**: レポート HTML の埋め込みの不具合を直す。メタデータの文字列からの parse と、git の範囲からの before / after の組み立てを作る。
2. **土台**: レポート仕様の型・スキーマ・検証、provider の仕組み、汎用コンポーネント（優先度 A）、`build_report` / `get_report_data` / `list_report_components`。
3. **解析済みのものから表示する**: オブジェクト（既存の ER 図を移し、`ObjectDetail`・`FieldDiffTable`）、翻訳（`TranslationCoverageTable`）、Apex の Diff（`ApexDiffView`）、LWC（`LwcComponentList`・`LwcComponentDetail`・`LwcDiffView`・`LwcFindingsList`、続けて `ComponentTree`・`LwcFieldUsageTable`）。
4. **Apex の解析**: 宣言・SOQL / DML（[apex-json-analysis.md](./apex-json-analysis.md)）と、`ClassOutline`・`SoqlDmlTable`。続けて `crossRef.fieldUsage`（Apex・LWC）。
5. **権限**: 解析木（[analysis-plan.md](./analysis-plan.md)の 1）と、`PermissionDiffTable`・`ObjectAccessMatrix`・`FieldAccessMatrix`。
6. **Flow**: 解析木と、`FlowList`・`FlowDiagram`・`FlowDiffView`。`automation.byObject` で Apex トリガー・入力規則とまとめる。
7. **画面**: Layout・FlexiPage の解析木と、`LayoutView`・`FlexiPageView`・`ComponentPlacement`。
8. **残り**: 呼び出し関係・依存・メトリクス・ルール違反・数式の解析・影響範囲（種類をまたぐもの）。

各段階で、[docs/examples/](./examples/README.md) のサンプルから実際にレポートを作り、skill の仕様の例も一緒に置く。新しい種類を足すときは、サンプルをサンプルのリポジトリ（`docs/examples/repository/`）に置く。

## 5. 決めたこと（2026-11-17 に決めた）

前提: このリポジトリの第一の目的は**ドキュメントの作成とコードの理解**で、差分と影響の調査はその補助。レポートの形はこちらで固定せず、利用者が組めることを強みにする（[implementation-roadmap.md](./implementation-roadmap.md) の冒頭）。

- **レポート仕様の範囲**: 雛形はいくつか用意して使えるようにする（ドキュメントの雛形 `system_overview`・`permission_overview` を主に、差分の雛形 `release_review`・`impact_analysis` を補助に）。雛形は出発点で、形は固定しない。AI に組ませるか、利用者が自分で書くか（雛形を直すかを含む）は利用者に任せる。製品の中心はカタログと検証（どんな文書でも正しく組めること）。
- **既定は今の状態のすべて**: provider の既定は 1 時点（作業ツリー）のすべてを返し、行に `status` を付けない。差分は文書・ツールの `diff: true`（保存した基準 → 作業ツリー）か `compare`（git の範囲）を渡したときだけ。`onlyChanged` は比べたときだけ効く（1 時点ならすべて）。差分だけを返す provider（`permission.diffs`・`flow.diffs`・`dependency.impact`・`dependency.changes`）は `requiresComparison` とし、比べる時点がなければ問題として返す。
- **AI の注記の対象**: `{ data: "<データの名前>", key: "<行のキー>" }`（API 名・単位の id など、provider が行ごとに出す識別子）。ビルドで行があるかを確かめる。`sourceKeys` は単位をまたいで一意でなく、ファイルと行は編集でずれるので使わない。差分の有無に関係なく同じ形。
- **1 つの HTML に埋め込む**: 埋め込みのまま。全件が既定なのでデータは大きくなりうる。大きさの上限を超えたら誤りにせず警告にし、絞り込みは差分ではなく範囲（オブジェクト・種類・名前）の引数で行う。大きい組織向けには、範囲ごとに複数のレポートに分ける例を雛形に入れる。上限の値は大きいリポジトリで測ってから決める。
- **翻訳の言語**: 既定はすべての言語・すべてのラベル。`languages?` で絞る。差分は `diff` のとき。
- **権限の表**: 既定は全件。差分は `diff`（と `onlyChanged`）を引数にする。
