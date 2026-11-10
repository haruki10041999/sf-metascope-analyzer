# レポート用コンポーネントと解析の方針（計画）

このリポジトリは **表示用コンポーネント** と、コンポーネントに渡す **データを作る解析** だけを持つ。どのコンポーネントをどこに置き、何を説明するかは **skill 側** が決める。

- skill はレポートの **フォーマット（レポート仕様）** を書く。CRM の画面定義のように、どのセクションにどのコンポーネントを置き、どのデータを渡すかを並べる。
- AI が考えるのは、文章（要約・リスクの説明・レビューの指摘）と、どのデータを見せるかの選択だけにする。数値・一覧・図はすべて解析の結果をそのまま使い、AI には書かせない。

この文書は計画であり、まだ実装していないものを含む。状態は各表の「状態」列に書く。解析木（JSON）をまだ作れていないメタデータは [analysis-plan.md](./analysis-plan.md)。

## 1. 全体の形

```text
skill（レポート仕様 + 書き方の指示）
   │  ① データの種類を選ぶ          ② AI が文章を書く
   ▼                                 ▼
MCP ツール ── get_data(provider, params) ──▶ 解析（data provider）──▶ 型付きデータ
   │
   └─ build_report(spec) ──▶ 仕様を検証 ──▶ viewer（コンポーネント）──▶ レポート HTML
```

| 層             | 置き場所                                                           | 役割                                                                                         |
| -------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| レポート仕様   | skill（このリポジトリは型とスキーマだけを持つ）                    | セクション・コンポーネント・データの参照・AI の文章                                          |
| data provider  | `src/analyzer/report/`（新規）                                     | 解析結果を、コンポーネントが受け取る型にする。名前（`object.fields` など）で呼べるようにする |
| コンポーネント | `src/viewer/components/`（新規。既存の `viewer/metadata/` は移す） | 型付きデータと AI の文章を受け取って描くだけ。解析はしない                                   |
| ビルド         | `src/builder/htmlBuilder.ts`                                       | 仕様とデータを 1 つの HTML に埋め込む                                                        |
| MCP            | `src/mcp/server.ts`                                                | provider の一覧・データの取得・レポートの作成を公開する                                      |

### 1.1 レポート仕様の形（案）

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

優先度: **A** = 最初に作る、**B** = 次に作る、**C** = 後で作る。状態の「既存」は `src/viewer/metadata/` にあるもの。コンポーネントはまだどれも未実装なので、「データ」列に元の解析の状態を書く（済（provider）= コンポーネントに渡すデータの provider まで実装済み、済 = 解析・Diff は実装済み、未 = 解析が未実装、木なし = 解析木（JSON）も未。[analysis-plan.md](./analysis-plan.md)）。

### 2.1 汎用

| コンポーネント                 | 用途                                                     | 受け取るデータ                              | 優先度 | 状態                             |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------- | ------ | -------------------------------- |
| `Section` / `Tabs`             | レポートの骨組み                                         | 仕様のセクション                            | A      | 未                               |
| `Narrative`                    | AI の文章（Markdown）                                    | 文字列                                      | A      | 未                               |
| `Callout`                      | 注意・リスク・推奨（severity 付き）                      | `{ severity, title, text, targets? }`       | A      | 未                               |
| `SummaryCards`                 | 件数の要約（追加 3・変更 5…）                            | `{ label, value, status? }[]`               | A      | 未                               |
| `DataTable`                    | 一覧（並べ替え・絞り込み・status の色分け）              | 列定義 + 行                                 | A      | 未                               |
| `StatusBadge` / `StatusLegend` | added / removed / changed / unchanged の表示             | status                                      | A      | 既存（ノード内のバッジ）         |
| `SourceSnippet`                | ソース・XML の抜粋（行番号、before / after の並列表示）  | `SourceSpan`（`findNodeSourceInfo` の結果） | A      | 未                               |
| `DiffTree`                     | 差分の木（`run-diff.ts` の summary.md を画面にしたもの） | `*JsonDiff` / `GumTreeDiff`                 | B      | 未（文字版は各 `run-diff.ts`）   |
| `Graph`                        | ノードとエッジの図（dagre で自動配置）                   | `{ nodes, edges }`                          | B      | 既存（オブジェクト専用）を汎用化 |
| `Matrix`                       | 行 × 列の対応表（○ / R / W など）                        | `{ rows, columns, cells }`                  | B      | 未                               |

### 2.2 オブジェクト

| コンポーネント             | 用途                                           | provider                     | 優先度 | データ                                                 |
| -------------------------- | ---------------------------------------------- | ---------------------------- | ------ | ------------------------------------------------------ |
| `ObjectGraph`              | ER 図（参照関係、差分の色分け）                | `object.dependencies`        | A      | 済（`viewer/metadata` を移す）                         |
| `ObjectDetail`             | 1 オブジェクトの項目一覧・設定値               | `object.detail`              | A      | 済                                                     |
| `FieldDiffTable`           | 項目の追加・削除・属性の変更（before → after） | `object.fieldDiffs`          | A      | 済                                                     |
| `PicklistTable`            | 選択リスト値（有効・既定・色、差分）           | `object.picklists`           | B      | 済                                                     |
| `ValidationRuleList`       | 入力規則（数式・メッセージ・有効、差分）       | `object.validationRules`     | B      | 済（数式の参照の解析は未）                             |
| `RecordTypeMatrix`         | レコードタイプ × 選択リスト値                  | `object.recordTypePicklists` | C      | 済                                                     |
| `TranslationCoverageTable` | 言語ごとの翻訳の有無・未翻訳・古い翻訳         | `translation.coverage`       | B      | 済（[object-translation.md](./object-translation.md)） |
| `TranslationDiffTable`     | 翻訳の変更（ラベル・ヘルプ・選択リスト値）     | `translation.diffs`          | C      | 済                                                     |

### 2.3 Apex

| コンポーネント         | 用途                                                                                                 | provider                 | 優先度 | データ                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ------ | ----------------------------------------------------------- |
| `ApexDiffView`         | 単位（クラス・トリガー・匿名 Apex）ごとの宣言・文の差分と -meta.xml（`SourceSnippet` と `DiffTree`） | `apex.diffs`             | A      | 済（`makeApexUnitDiffs`）                                   |
| `ApexMetaTable`        | API バージョン・status・パッケージ（差分付き）                                                       | `apex.meta`              | B      | 済                                                          |
| `ClassOutline`         | クラスのメンバー（メソッド・項目・修飾子・アノテーション）                                           | `apex.outline`           | A      | 未（[apex-json-analysis.md](./apex-json-analysis.md) 3 章） |
| `SoqlDmlTable`         | どこで何の SOQL / DML を実行しているか（オブジェクト・項目・ループ内か）                             | `apex.dataAccess`        | A      | 未（同 4 章）                                               |
| `CallGraph`            | メソッドの呼び出し関係                                                                               | `apex.callGraph`         | B      | 未（同 4・5 章）                                            |
| `ClassDependencyGraph` | クラス間の依存（extends / implements / 型の参照 / new）                                              | `apex.classDependencies` | B      | 未                                                          |
| `FindingsList`         | ルール違反の候補（ループ内 SOQL・ハードコード ID など）                                              | `apex.findings`          | B      | 未（同 2 章）                                               |
| `MetricsTable`         | メソッドごとの行数・ネスト・分岐数など                                                               | `apex.metrics`           | C      | 未                                                          |

### 2.4 LWC

| コンポーネント         | 用途                                                                                                                | provider               | 優先度 | データ                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `LwcComponentList`     | コンポーネントの一覧（公開先 `targets`、`isExposed`、API バージョン、JS / TS、読めなかったファイル）                | `lwc.components`       | A      | 済（JSON の `meta`・`modules`・`skippedFiles`）                                                                  |
| `LwcComponentDetail`   | 1 コンポーネントの `@api`（型）、`@wire`、発行するイベント、テンプレート・CSS                                       | `lwc.detail`           | A      | 済（`analyzeLwcComponent`）                                                                                      |
| `LwcDiffView`          | バンドルごとの差分（JS / TS のメンバー、テンプレートの要素の木、CSS の規則、js-meta.xml）                           | `lwc.diffs`            | A      | 済（`makeLwcBundleDiffs`）                                                                                       |
| `LwcFindingsList`      | 仕様違反（resolvedError）、テンプレートと JS の食い違い、子コンポーネントとの食い違い、カタログにない `lightning-*` | `lwc.findings`         | A      | 済（`resolvedError` と `analyzeLwcBundles` の `findings`）                                                       |
| `ComponentTree`        | 親子関係（`c-*` / `lightning-*`）とイベントの流れ（子の `CustomEvent` → 親の `on*`）                                | `lwc.componentTree`    | B      | 済（`localComponents`・`component.events`）                                                                      |
| `LwcFieldUsageTable`   | 参照するオブジェクト・項目（`@salesforce/schema`、`lightning-record-*-form` の `field-name`）                       | `lwc.fieldUsage`       | B      | 済（`metadataDependencies`）                                                                                     |
| `LwcApexCallTable`     | 呼ぶ Apex（`@wire` / imperative、`$` のリアクティブな参照）                                                         | `lwc.apexCalls`        | B      | 済（`lwcImport.apex`・解析の呼び出し（`analyzeLwcModuleCalls`）・`lwcWireConfig`）。戻り値の型は Apex の解析待ち |
| `LwcPublicApiTable`    | 公開 API の変更（`@api`・イベントの追加・削除）と、それを使う親コンポーネント                                       | `lwc.publicApiChanges` | B      | 済（Diff と `analyzeLwcBundles` を組み合わせる）                                                                 |
| `LwcTargetConfigTable` | 配置先ごとの設定プロパティ（`targetConfigs`）                                                                       | `lwc.targetConfigs`    | C      | 済                                                                                                               |
| `LwcStylingHooksTable` | 使っている・定義しているカスタムプロパティ（`--lwc-*` / `--slds-*`）                                                | `lwc.stylingHooks`     | C      | 済（CSS の宣言の `uses` / `defines`）                                                                            |
| `LwcWireframe`         | テンプレートの構造の画面モック（分岐はタブ、繰り返しは 1 件分）                                                     | `lwc.wireframe`        | B      | 済（テンプレートの JSON）。[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)                                        |
| `LwcSnapshot`          | 状態ごとの画面モック（`@lwc/engine-server` の SSR）                                                                 | `lwc.snapshot`         | C      | 未（試作で描画を確認。[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)）                                           |

### 2.5 権限（Profile / PermissionSet / PermissionSetGroup）

| コンポーネント         | 用途                                                                                   | provider                  | 優先度 | データ         |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------- | ------ | -------------- |
| `PermissionDiffTable`  | 権限セット・プロファイルの変更（オブジェクト・項目・Apex・カスタム権限・システム権限） | `permission.diffs`        | A      | 済（provider） |
| `ObjectAccessMatrix`   | 権限セット・プロファイル × オブジェクトの CRUD                                         | `permission.objectAccess` | A      | 済（provider） |
| `FieldAccessMatrix`    | 権限セット・プロファイル × 項目の参照・編集（変更した項目に絞れる）                    | `permission.fieldAccess`  | A      | 済（provider） |
| `ApexAccessTable`      | Apex クラス・Visualforce の実行権限                                                    | `permission.apexAccess`   | B      | 済（provider） |
| `EffectivePermissions` | 権限セットグループ（ミュートを含む）を合わせた、実際に与える権限                       | `permission.effective`    | B      | 済（provider） |

### 2.6 自動化（Flow）

| コンポーネント       | 用途                                                                                    | provider              | 優先度 | データ                                        |
| -------------------- | --------------------------------------------------------------------------------------- | --------------------- | ------ | --------------------------------------------- |
| `FlowList`           | Flow の一覧（種類・起動条件・対象オブジェクト・有効なバージョン）                       | `flow.list`           | A      | 済（provider）                                |
| `FlowDiagram`        | 要素と接続の図（差分の色分け）。`Graph` を使う                                          | `flow.diagram`        | A      | 済（provider）                                |
| `FlowDiffView`       | 要素ごとの差分（条件・割り当て・レコードの操作）                                        | `flow.diffs`          | A      | 済（provider）                                |
| `FlowReferenceTable` | 参照する項目・Apex アクション・サブフロー・画面の LWC                                   | `flow.references`     | B      | 済（provider）                                |
| `TriggerOrderTable`  | オブジェクトごとの自動化（Apex トリガー・レコードトリガーフロー・入力規則）の一覧と順序 | `automation.byObject` | B      | 済（provider。Flow・Apex トリガー・入力規則） |

### 2.7 画面（Layout / FlexiPage / タブ・アプリ）

| コンポーネント       | 用途                                                                                 | provider           | 優先度 | データ                                                             |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------ | ------ | ------------------------------------------------------------------ |
| `LayoutView`         | ページレイアウトのセクションと項目（必須・参照のみ）、関連リスト、ボタン（差分付き） | `layout.detail`    | B      | 済（provider）                                                     |
| `FlexiPageView`      | Lightning ページのリージョンと部品（LWC・標準の部品）とプロパティ                    | `flexiPage.detail` | B      | 済（provider）                                                     |
| `ComponentPlacement` | LWC がどの Lightning ページ・タブ・クイックアクションに置かれているか                | `lwc.placements`   | B      | 済（provider。Lightning ページのみ。タブ・クイックアクションは未） |
| `AppNavigationTable` | アプリのタブ・ユーティリティ                                                         | `app.navigation`   | C      | 木なし                                                             |

### 2.8 横断・変更範囲

| コンポーネント      | 用途                                                                   | provider              | 優先度 | データ                                             |
| ------------------- | ---------------------------------------------------------------------- | --------------------- | ------ | -------------------------------------------------- |
| `ChangedFilesTable` | git の差分の単位の一覧（種類・status）                                 | `change.files`        | A      | 一部（`GitParser` と各 Diff は済。組み立ては未）   |
| `FieldUsageMatrix`  | 項目 × 使う場所（Apex・LWC・Flow・レイアウト・入力規則の数式・権限）   | `crossRef.fieldUsage` | B      | 一部（LWC は済、Apex・Flow・レイアウト・数式は未） |
| `LabelUsageTable`   | カスタム表示ラベルの使用箇所（Apex・LWC・Visualforce）と未使用のラベル | `crossRef.labels`     | C      | 済（provider。LWC・Apex・Flow。Visualforce は未）  |
| `ImpactView`        | 変更した項目・メソッド・LWC の `@api` から影響を受けるもの             | `impact.byChange`     | C      | 未                                                 |

## 3. 必要な解析と実装

「状態」は 済 / 一部 / 未。provider は 1.1 の `data.provider` で指定する名前。

### 3.1 前提として直すもの

| 項目                                       | 内容                                                                                                                                                               | 状態                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| レポート HTML へのデータの埋め込み         | `htmlBuilder` の `define` 名、`main.tsx`、`index.html` の名前が食い違っていて、データが空になる（[metadata-implementation.md](./metadata-implementation.md) 9 章） | 未（不具合）                                                                        |
| 文字列からの parse                         | git の before 側（作業ツリーにない中身）を読むため、ファイルパスではなく中身を渡す入口                                                                             | 一部（Apex は `parseApexUnitFiles`、LWC は `parseLwcBundleFolder`。メタデータは未） |
| git の範囲からの before / after の組み立て | `GitParser.getDiffFiles` + `readDiffFileContent` で、範囲内の単位（クラス・バンドル・オブジェクトなど）の before / after を parse する                             | 一部（一覧と中身の取得は済）                                                        |

### 3.2 data provider（`src/analyzer/report/`）

provider は権限・Flow・画面・ラベル・指摘の一覧（`src/analyzer/report/`。名前 → 関数は `REPORT_PROVIDERS`、出力の型は `types.ts`）を実装済み。サンプルの出力は [examples/metadata/output/report/](./examples/metadata/README.md)（`run-folders.ts`）。ほかは「元にする解析」の状態を書く。

| provider                                                                                                            | 元にする解析                                                                                                           | 元の状態                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `change.files` / `change.summary`                                                                                   | `GitParser`、`makeApexUnitDiffs`・`makeLwcBundleDiffs`・`makeObjectUnitDiffs`・`makeObjectTranslationUnitDiffs` の件数 | 済（3.1 の組み立ては未）                                                                              |
| `object.dependencies` / `object.detail`                                                                             | `analyzeObject`、`getObjectDependencies`、`view.ts`                                                                    | 済（`view.ts` を provider にする）                                                                    |
| `object.fieldDiffs` / `object.picklists` / `object.validationRules` / `object.recordTypePicklists`                  | `CustomObjectJsonDiff` を表の行にする                                                                                  | 済                                                                                                    |
| `translation.coverage` / `translation.diffs`                                                                        | `analyzeTranslationCoverages`、`makeObjectTranslationUnitDiffs`                                                        | 済                                                                                                    |
| `apex.diffs` / `apex.meta`                                                                                          | `makeApexUnitDiffs`（単位ごとにソースと -meta.xml）                                                                    | 済                                                                                                    |
| `apex.outline` / `apex.dataAccess` / `apex.callGraph` / `apex.classDependencies` / `apex.metrics` / `apex.findings` | [apex-json-analysis.md](./apex-json-analysis.md) の解析                                                                | 未                                                                                                    |
| `lwc.components` / `lwc.detail` / `lwc.targetConfigs` / `lwc.stylingHooks`                                          | LWC の JSON（`LwcBundleJson`）、`analyzeLwcComponent`                                                                  | 済                                                                                                    |
| `lwc.diffs` / `lwc.publicApiChanges`                                                                                | `makeLwcBundleDiffs`（と `analyzeLwcBundles` の親子関係）                                                              | 済                                                                                                    |
| `lwc.findings` / `lwc.componentTree` / `lwc.fieldUsage` / `lwc.apexCalls`                                           | `resolvedError`、`analyzeLwcBundles`（`findings`・`localComponents`・`metadataDependencies`）、import と `@wire`       | 済（Apex の戻り値の型は未）                                                                           |
| `lwc.wireframe` / `lwc.snapshot`                                                                                    | テンプレートの JSON、SSR（[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)）                                             | 一部                                                                                                  |
| `permission.*`                                                                                                      | Profile・PermissionSet・PermissionSetGroup の解析木と、権限の計算（[analysis-plan.md](./analysis-plan.md)）            | 済（`src/analyzer/report/permission.ts`）                                                             |
| `flow.*` / `automation.byObject`                                                                                    | Flow の解析木と参照の取り出し                                                                                          | 済（`src/analyzer/report/flow.ts`）                                                                   |
| `layout.detail` / `flexiPage.detail` / `lwc.placements` / `app.navigation`                                          | Layout・FlexiPage・CustomTab・CustomApplication の解析木                                                               | 済（`src/analyzer/report/page.ts`。`app.navigation` は未）                                            |
| `crossRef.fieldUsage` / `crossRef.labels`                                                                           | 各種類の項目・ラベルの参照（Apex の SOQL / DML、LWC の `metadataDependencies`、Flow、レイアウト、数式）                | `crossRef.labels` は済（`src/analyzer/report/crossRef.ts`）。`crossRef.fieldUsage` は一部（LWC のみ） |
| `metadata.findings`                                                                                                 | 権限・ラベル・Flow・画面の解析の指摘（before と比べて、新しく出た・なくなった指摘）                                    | 済（`src/analyzer/report/crossRef.ts`）                                                               |
| `impact.byChange`                                                                                                   | Diff と参照の組み合わせ                                                                                                | 未                                                                                                    |

provider は次の規則で作る。

- 入力は parse 結果（before / after）と引数だけ。ファイルを直接読まない（MCP・テスト・サンプルで同じ結果になるように）。
- 出力の各行は、元のノードの `sourceKeys` とファイルのパスを持つ（`SourceSnippet` と AI の注記の対象に使う）。
- 出力の型はコンポーネントの props と同じ型にし、`src/analyzer/report/types.ts` に置く（viewer はこの型だけに依存する）。

### 3.3 レポート仕様とビルド

| 項目                     | 内容                                                                                                    | 状態 |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | ---- |
| 仕様の型と JSON Schema   | `ReportSpec`（1.1）。コンポーネントごとに受け取れる provider を決める                                   | 未   |
| 仕様の検証               | 未知のコンポーネント・provider、引数の型、注記の対象の存在                                              | 未   |
| ビルド                   | provider を実行してデータを埋め込み、viewer で描く。今の `Prop`（`type: 'metadata'`）を仕様に置き換える | 未   |
| コンポーネントのカタログ | skill に渡す、コンポーネント・provider・引数・出力例の一覧（このリポジトリから生成する）                | 未   |

### 3.4 MCP ツール

| ツール                             | 内容                                                                 | 状態 |
| ---------------------------------- | -------------------------------------------------------------------- | ---- |
| `list_report_components`           | カタログ（3.3）を返す                                                | 未   |
| `get_report_data`                  | provider を実行して型付きデータを返す（AI が文章を考えるための材料） | 未   |
| `build_report`                     | 仕様を検証して HTML を作る                                           | 未   |
| `save_objects` / `analyze_objects` | 今のツール。`build_report` に置き換えたら削除する                    | 済   |

## 4. 進め方（案）

1. **前提**: レポート HTML の埋め込みの不具合を直す。メタデータの文字列からの parse と、git の範囲からの before / after の組み立てを作る。
2. **土台**: レポート仕様の型・スキーマ・検証、provider の仕組み、汎用コンポーネント（優先度 A）、`build_report` / `get_report_data` / `list_report_components`。
3. **解析済みのものから表示する**: オブジェクト（既存の ER 図を移し、`ObjectDetail`・`FieldDiffTable`）、翻訳（`TranslationCoverageTable`）、Apex の Diff（`ApexDiffView`）、LWC（`LwcComponentList`・`LwcComponentDetail`・`LwcDiffView`・`LwcFindingsList`、続けて `ComponentTree`・`LwcFieldUsageTable`）。
4. **Apex の解析**: 宣言・SOQL / DML（[apex-json-analysis.md](./apex-json-analysis.md)）と、`ClassOutline`・`SoqlDmlTable`。続けて `crossRef.fieldUsage`（Apex・LWC）。
5. **権限**: 解析木（[analysis-plan.md](./analysis-plan.md)の 1）と、`PermissionDiffTable`・`ObjectAccessMatrix`・`FieldAccessMatrix`。
6. **Flow**: 解析木と、`FlowList`・`FlowDiagram`・`FlowDiffView`。`automation.byObject` で Apex トリガー・入力規則とまとめる。
7. **画面**: Layout・FlexiPage の解析木と、`LayoutView`・`FlexiPageView`・`ComponentPlacement`。
8. **残り**: 呼び出し関係・依存・メトリクス・ルール違反・数式の解析・影響範囲（種類をまたぐもの）。

各段階で、[docs/examples/](./examples/README.md) のサンプルから実際にレポートを作り、skill の仕様の例も一緒に置く。新しい種類を足すときは、サンプルをサンプルのリポジトリ（`docs/examples/repository/`）に置く。

## 5. 決めること

- レポート仕様を skill に書かせる範囲（セクションの構成まで skill で固定するか、AI に選ばせるか）。
- AI の注記の対象の書き方（API 名・`sourceKeys`・ファイルと行のどれを使うか）。
- 1 つの HTML にデータをすべて埋め込むか、大きいデータ（Apex の Diff・権限の表など）を別ファイルにするか。
- objectTranslation の言語の扱い（全言語を 1 つのレポートに並べるか、言語を引数にするか）。
- 権限の表の大きさ（権限セット × 項目は大きくなるので、変更した項目・オブジェクトに絞るのを既定にするか）。
