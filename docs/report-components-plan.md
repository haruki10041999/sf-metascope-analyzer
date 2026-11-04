# レポート用コンポーネントと解析の方針（計画）

このリポジトリは **表示用コンポーネント** と、コンポーネントに渡す **データを作る解析** だけを持つ。どのコンポーネントをどこに置き、何を説明するかは **skill 側** が決める。

- skill はレポートの **フォーマット（レポート仕様）** を書く。CRM の画面定義のように、どのセクションにどのコンポーネントを置き、どのデータを渡すかを並べる。
- AI が考えるのは、文章（要約・リスクの説明・レビューの指摘）と、どのデータを見せるかの選択だけにする。数値・一覧・図はすべて解析の結果をそのまま使い、AI には書かせない。

この文書は計画であり、まだ実装していないものを含む。実装済みかどうかは各表の「状態」列に書く。

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
                    "component": "ObjectGraph",
                    "data": {
                        "provider": "object.dependencies",
                        "params": { "targets": ["Invoice__c"], "depth": 2, "isDiff": true },
                    },
                },
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

優先度: **A** = 最初に作る、**B** = 次に作る、**C** = 後で作る。状態の「既存」は `src/viewer/metadata/` にあるもの。

### 2.1 汎用

| コンポーネント                 | 用途                                                    | 受け取るデータ                              | 優先度 | 状態                             |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------- | ------ | -------------------------------- |
| `Section` / `Tabs`             | レポートの骨組み                                        | 仕様のセクション                            | A      | 未                               |
| `Narrative`                    | AI の文章（Markdown）                                   | 文字列                                      | A      | 未                               |
| `Callout`                      | 注意・リスク・推奨（severity 付き）                     | `{ severity, title, text, targets? }`       | A      | 未                               |
| `SummaryCards`                 | 件数の要約（追加 3・変更 5…）                           | `{ label, value, status? }[]`               | A      | 未                               |
| `DataTable`                    | 一覧（並べ替え・絞り込み・status の色分け）             | 列定義 + 行                                 | A      | 未                               |
| `StatusBadge` / `StatusLegend` | added / removed / changed / unchanged の表示            | status                                      | A      | 既存（ノード内のバッジ）         |
| `SourceSnippet`                | ソース・XML の抜粋（行番号、before / after の並列表示） | `SourceSpan`（`findNodeSourceInfo` の結果） | A      | 未                               |
| `DiffTree`                     | 差分の木（summary.md の表示を画面にしたもの）           | `*JsonDiff`                                 | B      | 未（`run-diff.ts` に文字版あり） |
| `Graph`                        | ノードとエッジの図（dagre で自動配置）                  | `{ nodes, edges }`                          | B      | 既存（オブジェクト専用）を汎用化 |
| `Matrix`                       | 行 × 列の対応表（○ / R / W など）                       | `{ rows, columns, cells }`                  | B      | 未                               |

### 2.2 オブジェクト

| コンポーネント             | 用途                                           | データ（provider）           | 優先度 | 状態                            |
| -------------------------- | ---------------------------------------------- | ---------------------------- | ------ | ------------------------------- |
| `ObjectGraph`              | ER 図（参照関係、差分の色分け）                | `object.dependencies`        | A      | 既存（`viewer/metadata`）を移す |
| `ObjectDetail`             | 1 オブジェクトの項目一覧・設定値               | `object.detail`              | A      | 未                              |
| `FieldDiffTable`           | 項目の追加・削除・属性の変更（before → after） | `object.fieldDiffs`          | A      | 未                              |
| `PicklistTable`            | 選択リスト値（有効・既定・色、差分）           | `object.picklists`           | B      | 未                              |
| `ValidationRuleList`       | 入力規則（数式・メッセージ・有効、差分）       | `object.validationRules`     | B      | 未                              |
| `RecordTypeMatrix`         | レコードタイプ × 選択リスト値                  | `object.recordTypePicklists` | C      | 未                              |
| `TranslationCoverageTable` | 言語ごとの翻訳の有無・未翻訳・古い翻訳         | `translation.coverage`       | B      | 未（4 章）                      |
| `TranslationDiffTable`     | 翻訳の変更（ラベル・ヘルプ・選択リスト値）     | `translation.diffs`          | C      | 未（4 章）                      |

### 2.3 Apex

| コンポーネント         | 用途                                                                       | データ（provider）       | 優先度 | 状態 |
| ---------------------- | -------------------------------------------------------------------------- | ------------------------ | ------ | ---- |
| `ClassOutline`         | クラスのメンバー（メソッド・項目・修飾子・アノテーション）                 | `apex.outline`           | A      | 未   |
| `ApexDiffView`         | ファイルごとの宣言・文の差分（`SourceSnippet` と `DiffTree` の組み合わせ） | `apex.diffs`             | A      | 未   |
| `SoqlDmlTable`         | どこで何の SOQL / DML を実行しているか（オブジェクト・項目・ループ内か）   | `apex.dataAccess`        | A      | 未   |
| `ApexMetaTable`        | API バージョン・status・パッケージ（差分付き）                             | `apex.meta`              | B      | 未   |
| `CallGraph`            | メソッドの呼び出し関係                                                     | `apex.callGraph`         | B      | 未   |
| `ClassDependencyGraph` | クラス間の依存（extends / implements / 型の参照 / new）                    | `apex.classDependencies` | B      | 未   |
| `MetricsTable`         | メソッドごとの行数・ネスト・分岐数など                                     | `apex.metrics`           | C      | 未   |
| `FindingsList`         | ルール違反の候補（ループ内 SOQL・ハードコード ID など）                    | `apex.findings`          | B      | 未   |

### 2.4 横断・変更範囲

| コンポーネント      | 用途                                       | データ（provider）    | 優先度 | 状態                          |
| ------------------- | ------------------------------------------ | --------------------- | ------ | ----------------------------- |
| `ChangedFilesTable` | git の差分のファイル一覧（種類・status）   | `change.files`        | A      | 未（解析は `GitParser` で済） |
| `FieldUsageMatrix`  | Apex × オブジェクトの項目（参照・更新）    | `crossRef.fieldUsage` | B      | 未                            |
| `ImpactView`        | 変更した項目・メソッドから影響を受けるもの | `impact.byChange`     | C      | 未                            |

### 2.5 LWC

parse の方針は [lwc-parse-plan.md](./lwc-parse-plan.md)。どれも parse（未実装）を前提にする。

| コンポーネント         | 用途                                                                                                                                                                   | データ（provider）     | 優先度 | 状態                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ | ---------------------------------------------------------------------- |
| `LwcComponentList`     | コンポーネントの一覧（公開先 `targets`、`isExposed`、API バージョン、使う言語 JS / TS、読めなかったファイル）                                                          | `lwc.components`       | A      | 未                                                                     |
| `LwcComponentDetail`   | 1 コンポーネントの公開プロパティ（`@api`、型）、`@wire`、発火するイベント、テンプレート・CSS のファイル                                                                | `lwc.detail`           | A      | 未                                                                     |
| `LwcDiffView`          | バンドルごとの差分（中のファイルごとに、JS / TS のメンバー、テンプレートの要素、CSS の規則、js-meta.xml）                                                              | `lwc.diffs`            | A      | 未                                                                     |
| `ComponentTree`        | 親子関係（テンプレートの `c-*` / `lightning-*` のタグ）とイベントの流れ（子の `CustomEvent` → 親の `on*`）                                                             | `lwc.componentTree`    | B      | 未                                                                     |
| `LwcApexCallTable`     | 呼ぶ Apex（`@wire` / imperative、引数の `$` のリアクティブな参照、戻り値の型）                                                                                         | `lwc.apexCalls`        | B      | 未                                                                     |
| `LwcFieldUsageTable`   | 参照するオブジェクト・項目（`@salesforce/schema`、`getRecord` の `fields`、`lightning-record-*-form` の `field-name`）                                                 | `lwc.fieldUsage`       | B      | 未                                                                     |
| `LwcPublicApiTable`    | 公開 API の変更（`@api` の追加・削除・型の変更、イベントの追加・削除）と、それを使う親コンポーネント                                                                   | `lwc.publicApiChanges` | B      | 未                                                                     |
| `LwcTargetConfigTable` | 配置先ごとの設定プロパティ（`targetConfigs` の `property`、対象オブジェクト、フォームファクター）                                                                      | `lwc.targetConfigs`    | C      | 未                                                                     |
| `LwcStylingHooksTable` | 使っている・定義しているカスタムプロパティ（`--lwc-*` / `--slds-*`）                                                                                                   | `lwc.stylingHooks`     | C      | 未                                                                     |
| `LwcFindingsList`      | ルール違反の候補（仕様違反の resolvedError、`@track` の不要な使用、`lwc:dom="manual"`、`innerHTML` など）                                                              | `lwc.findings`         | B      | 未                                                                     |
| `LwcWireframe`         | テンプレートの構造の画面モック（分岐はタブ、繰り返しは 1 件分）。JS は実行しない                                                                                       | `lwc.wireframe`        | B      | 未（[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)）                   |
| `LwcSnapshot`          | 状態ごとの画面モック（`@lwc/engine-server` の SSR で描いた HTML。`lightning-*` は `lightning-base-components` を使える。状態の props と wire のモックは skill が指定） | `lwc.snapshot`         | C      | 未（試作で描画を確認。[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)） |

- 横断のコンポーネント（2.4）にも LWC のデータを足す: `FieldUsageMatrix` に LWC の項目参照、`ImpactView` に「Apex のメソッド・項目の変更 → それを使う LWC」、`ChangedFilesTable` に LWC のファイル。

## 3. 必要な解析と実装

「状態」は 済 / 一部 / 未。provider は 1.1 の `data.provider` で指定する名前。

### 3.1 前提として直すもの

| 項目                                       | 内容                                                                                                                                                               | 状態                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| レポート HTML へのデータの埋め込み         | `htmlBuilder` の `define` 名、`main.tsx`、`index.html` の名前が食い違っていて、データが空になる（[metadata-implementation.md](./metadata-implementation.md) 9 章） | 未（不具合）                 |
| 文字列からの parse                         | git の before 側（作業ツリーにない中身）を読むため、`ApexParser` / `MetadataParser` にファイルパスではなく中身を渡す入口を作る                                     | 未                           |
| git の範囲からの before / after の組み立て | `GitParser.getDiffFiles` + `readDiffFileContent` で、範囲内の Apex・オブジェクトの before / after を parse する                                                    | 一部（一覧と中身の取得は済） |

### 3.2 data provider（`src/analyzer/report/`）

| provider                                                                                           | 元にする解析                                                                                                                                                                                               | 状態                                 |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `change.files` / `change.summary`                                                                  | `GitParser`、`makeUnitDiffs`、`makeObjectUnitDiffs` の件数                                                                                                                                                 | 未（元は済）                         |
| `object.dependencies` / `object.detail`                                                            | `analyzeObject`、`getObjectDependencies`、`view.ts`                                                                                                                                                        | 一部（`view.ts` を provider にする） |
| `object.fieldDiffs` / `object.picklists` / `object.validationRules` / `object.recordTypePicklists` | `CustomObjectJsonDiff` を表の行にする                                                                                                                                                                      | 未（Diff は済）                      |
| `apex.diffs` / `apex.meta`                                                                         | `makeUnitDiffs`（ソース・-meta.xml）                                                                                                                                                                       | 未（Diff は済）                      |
| `apex.outline`                                                                                     | 宣言の解析（[apex-json-analysis.md](./apex-json-analysis.md) 3 章）                                                                                                                                        | 未                                   |
| `apex.dataAccess`                                                                                  | SOQL / SOSL / DML の解析（同 4 章）。query の JSON から FROM・SELECT・WHERE の項目を取り出し、DML の対象の型を推定する                                                                                     | 未                                   |
| `apex.callGraph` / `apex.classDependencies`                                                        | 式の解析（呼び出し・型の参照）とファイルをまたぐ名前解決（同 4・5 章）                                                                                                                                     | 未                                   |
| `apex.metrics` / `apex.findings`                                                                   | 走査（walker）と文脈（ループの深さなど）（同 2 章）                                                                                                                                                        | 未                                   |
| `crossRef.fieldUsage`                                                                              | `apex.dataAccess` とオブジェクトの項目（API 名の大文字小文字を区別しない対応付け）                                                                                                                         | 未                                   |
| `lwc.components` / `lwc.detail` / `lwc.targetConfigs`                                              | LWC の parse（JS / TS・HTML・CSS・js-meta.xml）と、バンドルの集約（[lwc-parse-plan.md](./lwc-parse-plan.md) 4 章）                                                                                         | 未                                   |
| `lwc.diffs` / `lwc.publicApiChanges`                                                               | LWC の Diff（バンドル単位。中のファイルはファイル名で対応付ける。JS / TS のメンバーは名前、テンプレートの要素は順序付き列か GumTree）                                                                      | 未                                   |
| `lwc.componentTree`                                                                                | テンプレートのタグ → コンポーネント、`CustomEvent` の名前 → 親の `on*` の突き合わせ                                                                                                                        | 未                                   |
| `lwc.apexCalls` / `lwc.fieldUsage`                                                                 | import（`@salesforce/apex` / `@salesforce/schema`）と `@wire` の設定、テンプレートの `field-name`。型は TS の型注釈と型の名前の解決（[lwc-parse-plan.md](./lwc-parse-plan.md) 3.1.4・3.1.5）と Apex の解析 | 未                                   |
| `lwc.stylingHooks` / `lwc.findings`                                                                | CSS の宣言、resolvedError、JS / テンプレートの解析                                                                                                                                                         | 未                                   |
| `impact.byChange`                                                                                  | Diff と参照の組み合わせ（同 5 章 `impact.ts`）                                                                                                                                                             | 未                                   |
| `translation.coverage` / `translation.diffs`                                                       | `analyzeTranslationCoverages`、`makeObjectTranslationUnitDiffs`                                                                                                                                            | 未（元は済）                         |

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

## 4. objectTranslation への対応

> 実装済み。詳細は [object-translation.md](./object-translation.md)。下は計画時の内容（項目の翻訳のファイルは、実際には翻訳のフォルダの直下に置かれる）。

オブジェクトの翻訳（`objectTranslations/<オブジェクト>-<言語>/`）を、オブジェクトと同じ流れ（XML → JSON → 解析 → Diff）で扱う。

### 4.1 読むファイル

| ファイル                                                   | ルート要素                | 中身                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<オブジェクト>-<言語>.objectTranslation-meta.xml`         | `CustomObjectTranslation` | `nameFieldLabel`、`gender`、`startsWith`、`caseValues`、`recordTypes`（label / description）、`validationRules`（errorMessage）、`webLinks`（label）、`layouts`（セクション名）、`quickActions`、`fieldSets`、`sharingReasons`、`standardFields` |
| `<項目>.fieldTranslation-meta.xml`（翻訳のフォルダの直下） | `CustomFieldTranslation`  | `name`、`label`、`help`、`relationshipLabel`、`picklistValues`（`masterLabel` → `translation`）                                                                                                                                                  |

- メタデータ API の形式（`<fields>` を objectTranslation-meta.xml の中に書く）も読む（オブジェクトと同じ）。
- 組織全体の `translations/<言語>.translation-meta.xml`（タブ・アプリ・カスタムラベルなど）は対象外（後で別の種類として足す）。

### 4.2 JSON の型（案）

| kind                                                                                                    | 型                             | 必ず持つもの                                                                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `objectTranslation`                                                                                     | `CustomObjectTranslationJson`  | `objectApiName`、`locale`（フォルダ名の最後の `-` 以降）、子の配列は「ないものは持たない」（オブジェクトと同じ） |
| `fieldTranslation`                                                                                      | `CustomFieldTranslationJson`   | `name`                                                                                                           |
| `picklistValueTranslation`                                                                              | `PicklistValueTranslationJson` | `masterLabel`（翻訳元の値のラベル）                                                                              |
| `recordTypeTranslation` / `validationRuleTranslation` / `webLinkTranslation` / `layoutTranslation` など | `*TranslationJson`             | `name`                                                                                                           |

- 置き場所は `src/analyzer/types/metadata/translation/`（XML → JSON の部品は `types/commons/xmlJson.ts` を使う）。
- parse の結果は、言語ごとに 1 つ（`id` は `<オブジェクト>-<言語>`）。オブジェクトの結果には混ぜない（翻訳だけが変わったときに、Diff と保存の単位を分けるため）。
- 保存は Apex・オブジェクトと同じ msgpack。ワーカーの `WorkerTaskType` に `'ObjectTranslation'` を足す。

### 4.3 Diff

- オブジェクトと同じ方針（[metadata-diff-policy.md](./metadata-diff-policy.md)）。言語のファイル単位は `id` で対応付け、子は名前（`name`、選択リスト値は `masterLabel`）で対応付ける（D）。
- 両方にない値は出さない。片方にだけある値・子の配列は `added` / `removed`。

### 4.4 解析（オブジェクトとの突き合わせ）

翻訳だけを見ても判断できないことが多いので、同じ時点のオブジェクトと組み合わせて解析する。

| 解析           | 内容                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 翻訳の網羅     | 言語ごとに、項目・選択リスト値・入力規則のメッセージ・レコードタイプのうち、翻訳がないもの                              |
| 宙に浮いた翻訳 | 削除された項目・選択リスト値を指す翻訳（オブジェクト側にない名前）                                                      |
| 古い翻訳の候補 | オブジェクト側のラベル・メッセージ・選択リスト値のラベルが変わったのに、翻訳が変わっていないもの（Diff と組み合わせる） |
| 翻訳が元と同じ | 翻訳の文字列がオブジェクト側のラベルと同じ（翻訳し忘れの候補）                                                          |

この結果を `translation.coverage` の provider にし、`TranslationCoverageTable` で表示する。

## 5. 進め方（案）

1. **前提**: レポート HTML の埋め込みの不具合を直す。文字列からの parse と、git の範囲からの before / after の組み立てを作る。
2. **土台**: レポート仕様の型・スキーマ・検証、provider の仕組み、汎用コンポーネント（優先度 A）、`build_report` / `get_report_data` / `list_report_components`。
3. **オブジェクト**: 既存の ER 図を移し、`object.*` の provider と、`ObjectDetail`・`FieldDiffTable` を作る。
4. **objectTranslation**: 4 章の parse・Diff・解析（済）と、`TranslationCoverageTable`。
5. **Apex**: 宣言・SOQL / DML の解析（[apex-json-analysis.md](./apex-json-analysis.md)）と、`ClassOutline`・`ApexDiffView`・`SoqlDmlTable`。続けて `crossRef.fieldUsage`。
6. **LWC**: parse（[lwc-parse-plan.md](./lwc-parse-plan.md) 7 章の順）と、`LwcComponentList`・`LwcComponentDetail`・`LwcDiffView`。続けて `ComponentTree`・`LwcApexCallTable`・`LwcFieldUsageTable`（Apex の解析とつなぐ）。
7. **残り**: 呼び出し関係・依存・メトリクス・ルール違反・影響範囲（Apex と LWC をまたぐもの）。

各段階で、`docs/examples/` のサンプルから実際にレポートを作り、skill の仕様の例も一緒に置く。

## 6. 決めること

- レポート仕様を skill に書かせる範囲（セクションの構成まで skill で固定するか、AI に選ばせるか）。
- AI の注記の対象の書き方（API 名・`sourceKeys`・ファイルと行のどれを使うか）。
- 1 つの HTML にデータをすべて埋め込むか、大きいデータ（Apex の Diff など）を別ファイルにするか。
- objectTranslation の言語の扱い（全言語を 1 つのレポートに並べるか、言語を引数にするか）。
