# やることリスト（リポジトリ全体）

2026-11-17 に作り直した。観点は「今やっている調査」と「コンポーネントがそろっているか（宣言単位・ファイル / フォルダ単位・ファイルタイプ単位・機能単位）」。前のリストの未完了の項目は、すべてこのリストのどこかに移した。終わったら消す。

- **第一の目的はドキュメントの作成とコードの理解**。差分と影響の調査はその補助（[implementation-roadmap.md](./implementation-roadmap.md) の冒頭「目的と既定」）。ドキュメント・理解に効くものを先にする。
- ここでの「コンポーネント」は、解析の結果をドキュメントとして見せる一式のこと。**解析（JSON）→ provider（データ）→ 部品（描き方）→ 雛形（ドキュメントの種類）** がそろって、はじめて利用者が使える。
- 優先度: **高** = 次にやる・ほかの作業の前提、**中** = その次、**低** = 後で・必要になったら。
- 終わった作業の記録: [implementation-roadmap.md](./implementation-roadmap.md) 8 章（R0〜R5・Q0〜Q4・既定・D1〜D5・M1〜M3）、[save-format-plan.md](./save-format-plan.md) 6 章、[json-redesign-plan.md](./json-redesign-plan.md) 5.1、[lwc-json-types.md](./lwc-json-types.md) 8 章、[ir-types.md](./ir-types.md) 6 章。

## 0. 今の状態と次にやる順番（推奨）

今あるもの（2026-11-17）: 単位の種類 53、provider 39、部品 22、ドキュメントの雛形 6（`system_overview`・`object_definition`・`apex_specification`・`lwc_overview`・`translation_overview`・`permission_overview`）と差分の雛形 2（`release_review`・`impact_analysis`）。**ドキュメントとして中身を見せる provider があるのは、53 種類のうち 15 種類ほど**（オブジェクト・翻訳・権限 4 種・Flow・Apex 3 種・LWC・レイアウト・Lightning ページ・ラベル）。残りの約 38 種類は、依存関係のグラフに名前が出るだけ（2.1）。

1. **今やっている調査を終える**（1 章）: 最初の parse（Apex）の時間とメモリ。
2. **すべての種類の土台の provider**（2.1 の最初）: どの種類でも「一覧」と「設定値」を出せる汎用の provider を作り、38 種類の穴をまとめて埋める。種類ごとの専用の provider は、そのあと必要なものから足す。
3. **宣言単位の穴**（2.2）: オブジェクトの子（リストビュー・項目セット・ボタン・レコードタイプなど）、Flow の要素の中身、ラベルの定義。
4. **機能単位（業務の領域）の雛形**（2.4・3 章）: 処理と自動化・セキュリティと共有・連携・分析。
5. **機能のまとまり**（2.5）: 起点（オブジェクトなど）から、関わる単位を種類をまたいで集めたドキュメント。
6. **見た目の確認**（5 章）: MCP Apps に対応したクライアントの中での表示。

## 1. 今やっている調査（性能・大きいリポジトリ。高）

NPSP（11,446 ファイル・単位 2,337）での計測と直したことは [implementation-roadmap.md](./implementation-roadmap.md) 8 章の M1〜M3（グラフ 37.7 → 1.3 秒、起動し直した読み込み 15 → 11 秒、DB 450 → 302 MB、HTML の大きさの警告、大きい表のページ分け）。

- [ ] **最初の parse が約 100 秒**（Apex のクラス 1 つ約 100 ms・ヒープ約 2.6 MB）。apex-parser（ANTLR）・IR・JSON のどこに時間とメモリがかかっているかを調べる。worker_threads での並列（ビルド版）も測る
- [ ] 翻訳（objectTranslation）の parse が 1 件 83 ms（NPSP の 552 件で 46 秒）。Apex の次に遅いので、あわせて調べる
- [ ] 計測のスクリプト `measure.ts` を、大きいリポジトリでも測れるようにする（同じリポジトリを同時に何度も持たない。NPSP では 8 GB を超えて止まった）
- [ ] provider の時間を大きいリポジトリで測る（NPSP で `system_overview` が 5 秒、`apex.outline` と `apex.interface` が 2〜3 秒。どこに時間がかかるか）
- [ ] S5 の残り（git の変更ファイルでの絞り込み・ファイルの監視）は今はやらない（決めたこと 8）。起動し直した時間のほとんどは DB からの組み直しだった

## 2. コンポーネントの網羅

記号: ◎ = ドキュメントの provider と部品がある、○ = 一部ある、△ = 依存関係のグラフ・`find_nodes` で名前と位置だけ分かる、× = ない。

### 2.1 ファイル・フォルダ単位（単位の種類 53）

まず、どの種類でも「単位の一覧（名前・ラベル・ファイル）」と「設定値（JSON のプロパティ）」を出せる汎用の provider を作る。専用の provider は、ドキュメントとしての読みやすさが要るものから足す。

- [ ] **汎用の provider `metadata.units`**（すべての種類の単位の一覧。種類・名前・ラベル・説明・ファイル・読めなかった要素 `skippedElements`）と **`metadata.properties`**（単位の設定値を「プロパティ名 → 値」の行で。表で書けるもの（`RecordSpec`）は行の表で）。機密の値は伏せる（`maskSensitive`）。雛形 `metadata_inventory`（種類ごとの一覧）も足す（高）

| まとまり           | 単位の種類                                                                                                                                                                                  | 今                                                                                        | 足りないもの（専用の provider の候補）                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| コード             | apexClass・apexTrigger・anonymousApex                                                                                                                                                       | ◎ `apex.outline`・`apex.dataAccess`・`apex.interface`                                     | -meta.xml（API バージョン・状態）`apex.meta`、呼び出しグラフ（2.2）                                        |
| コード             | lwc                                                                                                                                                                                         | ◎ `lwc.components`・`lwc.detail`・`lwc.wireframe`・`lwc.interface`・`lwc.placements`      | 親子関係の図 `lwc.componentTree`（2.2）                                                                    |
| コード             | aura・apexPage（Visualforce）・apexComponent                                                                                                                                                | △                                                                                         | 一覧と中身（属性・使う部品・コントローラー・差し込み）、Aura のイベント                                    |
| データモデル       | object                                                                                                                                                                                      | ◎ `object.*`（一覧・項目・選択リスト・入力規則・レコードタイプ・ER 図）                   | オブジェクトの子の残り（2.2）                                                                              |
| データモデル       | globalValueSet・standardValueSet・customMetadata                                                                                                                                            | △                                                                                         | 値セットの値の一覧、カスタムメタデータのレコードの一覧（型ごとの表）                                       |
| 多言語             | objectTranslation・translations・customLabels                                                                                                                                               | ○ `translation.*`（オブジェクトの翻訳だけ）・`crossRef.labels`（ラベルの使用箇所）        | ラベルの定義（値・言語・保護）と訳の網羅、組織の翻訳（translations）の網羅                                 |
| 画面               | layout・flexiPage                                                                                                                                                                           | ◎ `layout.detail`・`flexiPage.detail`                                                     | —                                                                                                          |
| 画面               | customTab・customApplication・quickAction・pathAssistant・staticResource                                                                                                                    | △                                                                                         | アプリのタブ・ユーティリティ `app.navigation`、クイックアクションの項目、パスの段階、静的リソースの一覧    |
| 処理・自動化       | flow                                                                                                                                                                                        | ◎ `flow.list`・`flow.diagram`・`flow.interface`・`flow.references`・`automation.byObject` | 要素の中身（2.2）                                                                                          |
| 処理・自動化       | workflow・approvalProcess・assignmentRules・autoResponseRules・escalationRules・duplicateRule・matchingRules                                                                                | △（入力規則・ワークフローの一部は `automation.byObject`）                                 | ルールの一覧・条件・アクション、承認の段階                                                                 |
| セキュリティ・共有 | permissionSet・mutingPermissionSet・profile・permissionSetGroup                                                                                                                             | ◎ `permission.*`                                                                          | 権限の残り（2.2）                                                                                          |
| セキュリティ・共有 | customPermission・sharingRules・role・group・queue                                                                                                                                          | △                                                                                         | 共有ルール（条件・共有先）、ロールの階層の図、公開グループ・キューの構成員、カスタム権限の一覧と使う所     |
| 連携               | namedCredential・externalCredential・remoteSiteSetting・cspTrustedSite・externalDataSource・platformEventChannel・platformEventChannelMember・platformEventSubscriberConfig・messageChannel | △                                                                                         | 連携先の一覧（URL などの機密の値は伏せる）、プラットフォームイベントとメッセージチャネルの発行・購読の流れ |
| 分析               | report・reportType・dashboard                                                                                                                                                               | △                                                                                         | レポート・レポートタイプの一覧と使う項目、ダッシュボードの部品                                             |
| 通知・メール       | emailTemplate・customNotificationType                                                                                                                                                       | △                                                                                         | メールテンプレートの一覧・差し込み項目・本文の表示                                                         |
| 組織の設定         | settings                                                                                                                                                                                    | △                                                                                         | 設定の一覧（種類ごとにどこまで読むかは未確認。11 章）                                                      |
| 単位がない（低）   | ConnectedApp・Letterhead・Document・ContentAsset・ExperienceBundle / Network / CustomSite / NavigationMenu — [json-gaps.md](./json-gaps.md) 3 章・7.4                                       | ×                                                                                         | 単位の種類と parser から                                                                                   |

- [ ] 同じ種類・同じ名前の単位が複数のパッケージディレクトリにあるときの扱い、翻訳のメタデータ API の形式（`.objectTranslation`） — [analysis-plan.md](./analysis-plan.md) 5.3・8.1 順 7

### 2.2 宣言単位（単位の中の要素）

#### Apex

- [x] クラス・インターフェース・enum・メソッド・コンストラクタ・プロパティ・項目・トリガーのイベント（`apex.outline`）、SOQL・SOSL・DML（`apex.dataAccess`）、外から使えるもの（`apex.interface`）
- [ ] 型の解決: リポジトリの中の継承とメソッドの戻り値の型をたどる（`getAccount().Name` が参照にならない）。標準クラスはよく使うものだけを手で一覧にする（決めたこと 10） — [apex-json-analysis.md](./apex-json-analysis.md) 7 章、[json-gaps.md](./json-gaps.md) 4.1（高）
- [ ] 呼び出しグラフ `apex.callGraph` / `CallGraph`、クラス間の依存 `apex.classDependencies` — [report-components-plan.md](./report-components-plan.md) 2.3（高）
- [ ] プロジェクトをまたぐ解析（シンボル表・使われていないメソッド・SObject の利用表・トリガーとハンドラー・テストクラスとテスト対象の対応） — apex-json-analysis 5.1（中）
- [ ] JSON にあるが使っていない情報（`@AuraEnabled(cacheable)` と LWC の `@wire` の突き合わせ・`@RestResource` などの公開 API の一覧・`@TestVisible` / SeeAllData・`@future(callout)`・`WITH SECURITY_ENFORCED` / `USER_MODE`・`FOR UPDATE`） — [apex-json-review.md](./apex-json-review.md) 4 章（中）
- [ ] メトリクス `apex.metrics` / `MetricsTable`（文の数・循環的複雑度・最大のネスト・SOQL / DML の数・呼び出しの数）（中）

#### LWC

- [x] @api・メソッド・イベント・slot・@wire・Apex・import・使うコンポーネント・項目（`lwc.detail`）、テンプレートの骨組み（`lwc.wireframe`）
- [ ] 親子関係とイベントの流れの図 `lwc.componentTree`（高）
- [ ] Apex の呼び出しの一覧 `lwc.apexCalls`（JSON と `analyzeLwcModuleCalls` はある。戻り値の型は Apex の型の解決のあと）（中）
- [ ] 項目の使い方 `lwc.fieldUsage`（中）
- [ ] TS の型の名前をバンドルをまたいで解決する、型注釈のない項目の型の推論（必要になったら TypeScript Compiler API） — [lwc-implementation.md](./lwc-implementation.md) 7 章（低）

#### オブジェクト

- [x] 項目・選択リスト値・入力規則・レコードタイプごとの選択リスト値・ER 図（`object.*`）
- [ ] オブジェクトの子の残り: レコードタイプ（一覧・有効・ビジネスプロセス）、リストビュー（列・条件）、項目セット、コンパクトレイアウト、ボタン・リンク（`webLinks`）、ビジネスプロセス、共有の理由、検索レイアウト、アクションの上書き（高。2.1 の `metadata.properties` の行の表で足りるものもある）
- [ ] 項目の暗号化・データの分類（`encryptionScheme`・`securityClassification`・`complianceGroup`）、積み上げ集計の条件 `summaryFilterItems` を読む — [metadata-json-review.md](./metadata-json-review.md) 4 章（中）
- [ ] 暗黙の標準項目をオブジェクトごとに変える（`OwnerId` の有無など） — [metadata-implementation.md](./metadata-implementation.md) 9 章（低）

#### Flow・自動化

- [x] 一覧・要素と接続の図・入出力の変数・参照・オブジェクトごとの自動化の順序
- [ ] 要素の中身 `flow.elements`（決定の条件・割り当て・レコードの操作の項目と条件・画面の項目・アクションの引数）（高）
- [ ] 承認プロセス・割り当て / 自動応答 / エスカレーションルール・重複 / 一致ルールの条件とアクション（2.1 と同じ。中）

#### 権限・セキュリティ

- [x] オブジェクト・項目の権限の行列、Apex・Visualforce の実行権限、権限セットグループが与える権限
- [ ] システム権限・カスタム権限・タブの表示・レコードタイプの表示・ページレイアウトの割り当て・権限セットグループの構成（中）

#### 画面

- [x] ページレイアウト・Lightning ページ・LWC の置き場所（Lightning ページだけ）
- [ ] LWC の置き場所をタブ・クイックアクションにも広げる（低）

#### ラベル

- [x] ラベルの使用箇所と使われていないラベル（`crossRef.labels`。LWC・Apex・Flow）
- [ ] ラベルの定義の一覧（値・言語・保護・分類）と訳の網羅（中）、Visualforce での使用箇所（低）

### 2.3 ファイルタイプ単位

| ファイル                                                 | 解析                          | ドキュメント                 | 足りないもの                                              |
| -------------------------------------------------------- | ----------------------------- | ---------------------------- | --------------------------------------------------------- |
| `.cls`・`.trigger`・`.apex`                              | ◎ IR → JSON                   | ◎ `apex.*`                   | —                                                         |
| Apex の `-meta.xml`                                      | ◎                             | ×                            | API バージョン・状態・パッケージ `apex.meta`（中）        |
| LWC の `.js`・`.ts`                                      | ◎ IR → JSON                   | ◎ `lwc.detail`               | —                                                         |
| LWC の `.html`                                           | ◎                             | ◎ `lwc.wireframe`            | 画面のスナップショットの方式 B（低。下）                  |
| LWC の `.css`                                            | ◎（規則・カスタムプロパティ） | ×                            | 使う・定義するカスタムプロパティ `lwc.stylingHooks`（低） |
| LWC の `.js-meta.xml`                                    | ◎                             | ○ `lwc.components`（公開先） | 置き場所ごとの設定 `lwc.targetConfigs`（低）              |
| オブジェクトのフォルダの XML                             | ◎                             | ◎ `object.*`                 | 子の残り（2.2）                                           |
| Flow の XML                                              | ◎                             | ◎ `flow.*`                   | 要素の中身（2.2）                                         |
| Aura（`.cmp`・`.app`・`.evt`・`.js`・`.css`・`.design`） | ○ マークアップの木・関数名    | ×                            | 一覧と中身（2.1）、JS の中身の解析（6 章）                |
| Visualforce（`.page`・`.component`）                     | ○ マークアップの木            | ×                            | 一覧と中身（2.1）                                         |
| メールテンプレート（`.email`）                           | ○                             | ×                            | 本文の表示（git の行の差分を含む）                        |
| 静的リソース（`.resource`）                              | △ -meta.xml だけ              | ×                            | 一覧（中身は読まない）                                    |
| ほかのメタデータの XML                                   | ◎                             | ×                            | 2.1 の汎用の provider                                     |

- [ ] 本文のテキスト（メール・Visualforce・Aura の JS）の表示。差分のときは git の行の差分 — [analysis-plan.md](./analysis-plan.md) 4 章（中）
- [ ] 画面のスナップショットの方式 B（`lwc.snapshot` / `LwcSnapshot`。明示したときだけ。`lightning-*` のスタブ、`@salesforce/*`・`lightning/*` のモック、`node:vm` のワーカーでの隔離と時間の上限、`<style>` の重複、描画後の値、アイコンの SVG、SLDS の CSS）と `lwc.snapshotDiff` — [lwc-snapshot-plan.md](./lwc-snapshot-plan.md) 6・7 章（低）

### 2.4 機能単位（業務の領域）

| 領域               | 今の provider                                  | 雛形                     | 足りないもの                                                                                   |
| ------------------ | ---------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| データモデル       | ◎ `object.*`                                   | ◎ `object_definition`    | 値セット・カスタムメタデータのレコード・外部オブジェクト                                       |
| 画面               | ◎ `layout.detail`・`flexiPage.detail`・`lwc.*` | ○ `lwc_overview`         | 画面の雛形 `ui_overview`（アプリ・タブ・ページ・レイアウト・クイックアクション・パス）         |
| 処理（コード）     | ◎ `apex.*`                                     | ◎ `apex_specification`   | 呼び出しグラフ                                                                                 |
| 自動化             | ○ `flow.*`・`automation.byObject`              | ×                        | 雛形 `automation_overview`（Flow・トリガー・入力規則・ワークフロー・承認・各種ルールと実行順） |
| セキュリティ・共有 | ○ `permission.*`                               | ○ `permission_overview`  | 共有ルール・ロールの階層・グループ・キュー。雛形 `security_overview`                           |
| 連携               | ×                                              | ×                        | 連携先・イベント・メッセージチャネル。雛形 `integration_overview`（機密の値は伏せる）          |
| 多言語             | ○ `translation.*`・`crossRef.labels`           | ◎ `translation_overview` | ラベルの定義と訳・組織の翻訳                                                                   |
| 分析               | ×                                              | ×                        | レポート・レポートタイプ・ダッシュボード。雛形 `analytics_overview`                            |
| 依存関係・影響     | ◎ `dependency.*`                               | ○ `impact_analysis`      | —                                                                                              |

### 2.5 機能のまとまり（種類をまたいだ横断）

- [ ] **起点（オブジェクト・クラス・LWC など）から、関わる単位を種類をまたいで集める provider `feature.scope`**（依存関係のグラフを両方向に数段たどる）と、雛形 `feature_overview`（そのまとまりのデータモデル・画面・処理・自動化・権限を 1 つのドキュメントに）（高）
- [ ] 項目 × 使う場所（Apex・LWC・Flow・レイアウト・数式・権限）の行列 `crossRef.fieldUsage` / `FieldUsageMatrix`（今は LWC だけ） — [report-components-plan.md](./report-components-plan.md) 2.8（中）

## 3. 雛形とレポートの仕組み

- [ ] 2.4 の領域ごとの雛形（`automation_overview`・`security_overview`・`ui_overview`・`integration_overview`・`analytics_overview`）と `metadata_inventory`（2.1）・`feature_overview`（2.5）（高〜中。provider ができたものから）
- [ ] 大きい組織向けに、範囲ごとに文書を分ける例を雛形に入れる（決めたこと 4）（中）
- [ ] AI の注記（annotations）を仕様に入れる（対象は `{ data, key }`。行がなければビルドで問題にする。決めたこと 3） — [report-components-plan.md](./report-components-plan.md) 1.1・3.3（中）
- [ ] JavaScript なしの静的な HTML（印刷・メール向け。React の `prerender`） — [implementation-roadmap.md](./implementation-roadmap.md) 2.2・4.4（低）

## 4. 差分とチェック（補助。中〜低）

- [ ] 差分の provider: `object.fieldDiffs`・`apex.diffs`・`lwc.diffs`・`lwc.publicApiChanges`・`change.files`・`change.summary`・`translation.diffs`（いずれも `requiresComparison`） — report-components-plan 2.2〜2.4・2.8
- [ ] 部品: 差分の木 `DiffTree`、ソースの before / after の並列表示
- [ ] チェックの provider: `lwc.findings`、Apex の findings `apex.findings` / `FindingsList`（ルールはコードに書き、メタデータとまたがるルールに絞る。PMD と重ねない。決めたこと 11）
- [ ] Apex の変更の影響（メトリクスの増減・SOQL の項目と条件の増減・呼び出しグラフを逆にたどる影響・新しく出た findings） — [apex-json-analysis.md](./apex-json-analysis.md) 5.2
- [ ] Apex の Diff の型: `triggerCase` に fields を持たせる、`notSet` の変化、annotation の Diff を分けるか — 同 6.4・6.5
- [ ] 名前の変更の推定（項目・メソッドなどファイルの中の要素。今は removed + added）と、依存の差分での利用 — [analysis-plan.md](./analysis-plan.md) 5.4

## 5. 品質・道具（高〜中）

- [ ] 改行コード: git の中（index）に CRLF のファイルが 172 ある。次のコミットで `git add --renormalize .` をかける（改行コードだけのコミットに分ける）
- [ ] CI（[.github/workflows/ci.yml](../.github/workflows/ci.yml)）の GitHub の上での最初の実行を確かめる（特に Ubuntu）
- [ ] `package-lock.json` を `.gitignore` から外してコミットし、CI を `npm ci` にする
- [ ] ルートの `tmp-lwc-baseline.ts`（コミット済みの一時スクリプト）と `test/_count_nodes.tmp.ts`（未追跡）を消すか決める
- [ ] レポートの見た目: MCP Apps に対応したクライアント（Claude など）の中での表示と、雛形をクライアントから使う流れ（ブラウザでの見た目は 2026-11-17 に画面写真で確かめた）
- [ ] 新しい provider ごとに、出力のスキーマ・1 時点 / 比べるとき・絞り込みの引数のテストを書く決まりを [commons.md](./commons.md) に書く（今の provider はそろっている）
- [ ] 機密の値: 2.1 の汎用の provider・連携の provider で、伏せる種類（指定ログイン情報・外部ログイン情報など）の値が出ないことのテスト
- [ ] S3 の残り: `key` で中身の比較を省いた差分が、すべて比べた差分と同じことのテスト — [save-format-plan.md](./save-format-plan.md) 4.3・6 章
- [ ] Apex のサンプルの全 Diff を実行時の型（zod）で検査するテスト — [apex-json-analysis.md](./apex-json-analysis.md) 6.5
- [ ] 実際の組織に近いリポジトリ（NPSP など）で、読めない要素・`skippedElements`・指摘の誤検出を洗い出す — [analysis-plan.md](./analysis-plan.md) 5.6
- [ ] 分解された形式・メタデータ API の形式をサンプルのリポジトリに入れる（テストはある）、Apex の不具合の確認用の構文がサンプルに入っているか — [apex-json-review.md](./apex-json-review.md) 6.3

## 6. 参照・依存関係の穴（中〜低。[json-gaps.md](./json-gaps.md) 7.4 ほか）

- [ ] Apex: 動的 SOQL（リテラルの文字列）、`Schema.getGlobalDescribe().get('X')`・`describeSObjects`、`rec.get('Field__c')` / `put`、変数で渡した `FeatureManagement.checkPermission`、`.` でつないだ型、`HAVING` の中の項目が `via: soql.where` になる — json-gaps 4.1・7.4、[apex-json-review.md](./apex-json-review.md) 4 章
- [ ] LWC: テンプレートの式の値の解決（`field-name={nameField}`）、`@salesforce/contentAssetUrl/`・名前空間つきの `@salesforce/label/ns.X`・`@salesforce/userPermission/X`・`lightning/ui*` 以外の `@wire` のアダプター、import（カスタム権限・静的リソース・メッセージチャネル）がグラフに出るかを確かめる — json-gaps 3 章・4.2、[analysis-plan.md](./analysis-plan.md) 3.3
- [ ] Aura: JS の参照（`component.get('c.method')`・`$A.get('e.c:event')`）と `aura:handler` のイベント、`{!v.x}` / `{!c.handle}` が属性・関数に実在するか、JS の中身の解析 — json-gaps 3 章、[metadata-json-review.md](./metadata-json-review.md) 4 章
- [ ] オブジェクト: 主従関係・積み上げ集計の対象・制御項目・`lookupFilter` の項目を参照にする、`searchLayouts`・`webLinks` の URL と数式の中の項目 — analysis-plan 3.3、json-gaps 4.3
- [ ] レイアウトの `customLink`・`miniLayout`・`summaryLayout`・`feedLayout`、Visualforce・メールの差し込みの標準の項目（`{!Account.Name}`）とコントローラーのプロパティ — metadata-json-review 4 章・7.1 #7
- [ ] Flow の `submit`（承認プロセス）、Id を直接書いたカスタム通知、レポートタイプの関係をたどった列、重複ルールの条件の項目、定義のない権限の行、組織の設定の中の参照、カスタムメタデータのレコードの値の中の参照 — json-gaps 2.1・2.2・4.5・6 章・7.3・7.4

## 7. 解析のコードの整理と IR（中〜低）

- [ ] provider が `Repository` を直接読む（`snapshotInputOf` の変換をやめる）、provider の単位の status を構造の Diff に寄せる — [analysis-plan.md](./analysis-plan.md) 1.3・8.1
- [ ] オブジェクトの子のうち表で書けるもの（入力規則・Web リンク・共有の理由など）を `RecordSpec` に移す（決めたこと 7。2.1 の `metadata.properties` と一緒に） — 同 1.1
- [ ] 種類ごとの解析の関数から参照先の確かめを外し、`MetadataContext`・`ReferenceInputs` を整理する、指摘の形を「単位の id + 行の sourceKeys」にそろえる — 同 1.4
- [ ] 種類ごとに分かれたサンプルのスクリプト（run-diff・run-parse など）を 1 つにまとめる — 同 1.5
- [ ] SOSL・項目の一覧で、関数のあとの別名（`TOLABEL(x) alias`）を JSON に出す — [ir-types.md](./ir-types.md) 4 章（低）
- [ ] IR の型の後回しの 5 件（引数の rest・識別子の 3 分け・Flow と TS の型注釈・`.js` と `.ts` のノードの型・tSTupleType など）。単独ではやらず、その部分を触るときに一緒に直す（決めたこと 15） — ir-types 5.3・6 章（低）

## 8. ドキュメント・ライブラリ（中〜低）

- [ ] 各 `*-implementation.md`（Apex・LWC・メタデータ）を 1 つの流れの説明にまとめ直す。あわせて、計画の文書に残る案の名前（[apex-json-analysis.md](./apex-json-analysis.md) の `impact.ts`・`project.ts`、[apex-json-review.md](./apex-json-review.md) 3.2 の LWC の型の `text`）を整理する
- [ ] コンポーネントの網羅の表（2.1〜2.4）を、登録表（`PROVIDER_DEFINITIONS`）と単位の種類（`UNIT_TYPES`）から作る（手で書くとずれる。カタログと同じく `npm run catalog` で）
- [ ] JSON の型の説明（属性ごと）を型から生成する（必要になったら）
- [ ] `@apexdevtools/apex-parser` を 5.3.0 に上げる（ゴールデンで確かめる。1 章の parse の調査と一緒に）、`ttsx` / `ttsc` を `tsx` などに替える、`recharts`・`elkjs`（必要になったら） — [implementation-roadmap.md](./implementation-roadmap.md) 2 章
- [ ] PostgreSQL と `kysely`（チームで共有するサーバーの形が要るとき）、`node:sqlite` で困ったら `better-sqlite3`、DB から読んだ木を検証するスキーマ、定義・参照の SQL の表 — 同 5 章（低）

## 9. 決めたこと（2026-11-17）

前提: 第一の目的はドキュメントの作成とコードの理解で、差分と影響の調査は補助。レポートの形は固定せず、利用者が組めることを強みにする。

| #   | 項目                        | 決めたこと                                                                                                                                                          | 書いた場所                                                          |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | レポート仕様の範囲          | 雛形はいくつか用意して使えるようにする（ドキュメントを主に、差分を補助に）。形は固定せず、AI に組ませるか利用者が書くかは利用者に任せる。製品の中心はカタログと検証 | [report-components-plan.md](./report-components-plan.md) 5 章       |
| 2   | 既定と差分                  | 既定は今の状態のすべて（1 時点・status なし）。差分は `diff` / `compare` のときだけ。差分だけの provider は `requiresComparison`（実装済み）                        | [implementation-roadmap.md](./implementation-roadmap.md) 冒頭・8 章 |
| 3   | AI の注記の対象             | `{ data, key }`（行のキー）。ビルドで行があるかを確かめる（未実装。3 章）                                                                                           | report-components-plan 5 章                                         |
| 4   | 1 つの HTML に埋め込むか    | 埋め込みのまま。8 MB を超えたら警告。絞り込みは範囲の引数（実装済み）。範囲ごとに分ける例を雛形に（未実装。3 章）                                                   | report-components-plan 5 章                                         |
| 5   | 翻訳の言語                  | 既定はすべて。`languages` で絞る（実装済み）                                                                                                                        | report-components-plan 5 章                                         |
| 6   | 権限の表                    | 既定は全件。差分は `diff`（と `onlyChanged`）（実装済み）                                                                                                           | report-components-plan 5 章                                         |
| 7   | HTML・XML・CSS の IR        | 入れない。XML は `RecordSpec` に整理する                                                                                                                            | [implementation-roadmap.md](./implementation-roadmap.md) 7 章       |
| 8   | Q2・S5 の残り               | NPSP の計測で、起動し直した読み込みのほとんどは DB から木を組み直す時間だった。ドキュメントはすべての種類を読むので Q2 は効きにくい。S5 の残りはやらない            | implementation-roadmap 8 章 M1・M2                                  |
| 9   | Apex の解析の順番           | クラスの概要 → データアクセス → 呼び出しグラフ。findings は後（概要・データアクセスは実装済み）                                                                     | [apex-json-analysis.md](./apex-json-analysis.md) 7 章               |
| 10  | 型の解決・標準クラス        | リポジトリの中は継承と戻り値の型までたどる。標準クラスはよく使うものだけ（未実装。2.2）                                                                             | apex-json-analysis 7 章                                             |
| 11  | findings                    | 優先度を下げる。コードに書き、引数で切り替え、メタデータとまたがるルールに絞る。PMD と重ねない                                                                      | apex-json-analysis 7 章                                             |
| 12  | 画面のスナップショット      | 方式 A を先に（実装済み）。JS は既定では実行しない。方式 B は明示したときだけ、隔離して                                                                             | [lwc-snapshot-plan.md](./lwc-snapshot-plan.md) 7 章                 |
| 13  | `lightning-base-components` | 今は使わず、スタブで描く                                                                                                                                            | lwc-snapshot-plan 7 章                                              |
| 14  | 選択リスト値の並び順        | ドキュメントでは定義の順。`diff` のときは「並び順が変わった」印を 1 つ（実装済み）                                                                                  | [metadata-implementation.md](./metadata-implementation.md) 9 章     |
| 15  | ir-types の後回しの 5 件    | 単独ではやらず、その部分を触るときに一緒に直す                                                                                                                      | [ir-types.md](./ir-types.md) 6 章                                   |
| 16  | 保存の作り                  | 案 A（1 ノード 1 行）のまま。単位ごとの解析結果をかたまりで持つ案は採らない（2026-11-17）                                                                           | implementation-roadmap 8 章 M2                                      |

未決のまま: `DiffOf` の型が深くなりすぎたときにどこで止めるか（[apex-json-analysis.md](./apex-json-analysis.md) 7 章）。

## 10. 未確認（確かめていないこと）

- Flow の画面の項目の `objectFieldReference`（動的な項目）、Flow のアクションの引数の名前と Apex の `@InvocableVariable` の突き合わせ — [metadata-json-review.md](./metadata-json-review.md) 4 章
- Profile のパスワードの方針・セッションの設定、共有セット・テリトリー、Lightning のメールテンプレート（`{{{Recipient.Name}}}`）・Visualforce のメールテンプレート（`messaging:`）が単位・参照になっていない — 同 4 章
- 数式の演算子の一覧を Salesforce の文書で確かめていない — 同 6.1
- 組織の設定（settings）を種類ごとにどこまで読むか、LWC のバンドルの `.svg` などのファイルの扱い、祖先のフォームのオブジェクトが分からない `field:Name` のグラフでの見え方 — [json-gaps.md](./json-gaps.md) 2.2・3 章・4.2
- ほかの単位を読んで parse する種類がないか — [save-format-plan.md](./save-format-plan.md) 3.2
- `DiffOf` の型が深くなりすぎていないか（今の typed.ts） — [apex-json-analysis.md](./apex-json-analysis.md) 7 章
