# やることリスト（リポジトリ全体）

2026-11-17 に作り直した。観点は「今やっている調査」と「コンポーネントがそろっているか（宣言単位・ファイル / フォルダ単位・ファイルタイプ単位・機能単位）」。前のリストの未完了の項目は、すべてこのリストのどこかに移した。終わったら消す。

- **第一の目的はドキュメントの作成とコードの理解**。差分と影響の調査はその補助（[implementation-roadmap.md](./implementation-roadmap.md) の冒頭「目的と既定」）。ドキュメント・理解に効くものを先にする。
- ここでの「コンポーネント」は、解析の結果をドキュメントとして見せる一式のこと。**解析（JSON）→ provider（データ）→ 部品（描き方）→ 雛形（ドキュメントの種類）** がそろって、はじめて利用者が使える。
- 優先度: **高** = 次にやる・ほかの作業の前提、**中** = その次、**低** = 後で・必要になったら。
- 実装の作業を場所ごと（解析・provider・部品と viewer・ビルド・CLI と MCP・品質）に並べた一覧と、ここにない改修・追加は [implementation-tasks.md](./implementation-tasks.md) にある。
- 終わった作業の記録: [implementation-roadmap.md](./implementation-roadmap.md) 8 章（R0〜R5・Q0〜Q4・既定・D1〜D9・M1〜M5）、[save-format-plan.md](./save-format-plan.md) 6 章、[json-redesign-plan.md](./json-redesign-plan.md) 5.1、[lwc-json-types.md](./lwc-json-types.md) 8 章、[ir-types.md](./ir-types.md) 6 章。

## 0. 今の状態と次にやる順番（推奨）

今あるもの（2026-11-18）: 単位の種類 53、provider 50、部品 27、ドキュメントの雛形 13（`system_overview`・`object_definition`・`apex_specification`・`lwc_overview`・`translation_overview`・`metadata_inventory`・`automation_overview`・`security_overview`・`ui_overview`・`integration_overview`・`analytics_overview`・`feature_overview`・`permission_overview`）と差分の雛形 2（`release_review`・`impact_analysis`）。すべての種類は汎用の provider（`metadata.units`・`metadata.properties`）で一覧と設定値を見せられる。専用の provider があるのは 15 種類ほど（オブジェクト・翻訳・権限 4 種・Flow・Apex 3 種・LWC・レイアウト・Lightning ページ・ラベル）。

1. **今やっている調査を終える**（1 章）: 最初の parse（Apex）の時間とメモリ。
2. ~~**すべての種類の土台の provider**~~（2026-11-18 に済んだ。`metadata.types`・`metadata.units`・`metadata.properties`・雛形 `metadata_inventory`）。種類ごとの専用の provider は、ここから必要なものを足す。
3. ~~**宣言単位の穴**~~（2026-11-18 に済んだ。`object.members`・`flow.elements`・`label.definitions`）。Apex の型の解決・呼び出しグラフ、LWC の親子関係の図は 2.2 に残る。
4. ~~**機能単位（業務の領域）の雛形**~~（2026-11-18 に済んだ。`automation_overview`・`security_overview`・`ui_overview`・`integration_overview`・`analytics_overview`）。
5. ~~**機能のまとまり**~~（2026-11-18 に済んだ。provider `feature.scope`・雛形 `feature_overview`）。
6. **利用者が自分で使える形にする**（3.2〜3.4・3.6）: ~~3.2.1（部品ごとのデータ・for / if・レイアウト・Apex と LWC の処理フロー・流れの図）~~（2026-11-18 に済んだ。U1〜U8）。次は、人向けの手引き（3.2）、表の並べ替えと書き出し・依存関係の図（3.6）、対象リポジトリの設定ファイルと利用者の雛形（3.3）、配布の形と使い始めの手引き（3.4）。
7. **見た目の確認**（5 章）: MCP Apps に対応したクライアントの中での表示。

## 1. 今やっている調査（性能・大きいリポジトリ。高）

NPSP（11,446 ファイル・単位 2,337）での計測と直したことは [implementation-roadmap.md](./implementation-roadmap.md) 8 章の M1〜M3（グラフ 37.7 → 1.3 秒、起動し直した読み込み 15 → 11 秒、DB 450 → 302 MB、HTML の大きさの警告、大きい表のページ分け）。

- [x] **最初の parse**（2026-11-18。[implementation-roadmap.md](./implementation-roadmap.md) 8 章の M4）: Apex 1 クラス 109 → 58 ms（位置のキーの作り方。キーの値は変えずに）、翻訳 1 件 139 → 2.2 ms（`fs.promises.readFile` をやめた）、読み込み中の DB の書き込みを 1 つのトランザクションに、worker が単位ごとにすべてのファイルを一覧し直していたのを直し、parse を worker_threads に任せられるようにした（ビルド版の MCP は既定で最大 8 スレッド。Apex の parse 96 → 18 秒）
- [x] 最初の読み込みの残り（2026-11-18。M5）: DB への書き込みを別のスレッドにした（ビルド版・8 スレッドで最初の読み込み 101 → 28 秒、3 回の中央値）。`node_kind` の索引を後で作る案は、書き込みが別のスレッドに移ったので見送り
- [x] apex-parser を 5.3.0 に上げた（速さは変わらない。構文エラーのメッセージの語の一覧だけ変わり、ゴールデンを作り直した）
- [x] 計測のスクリプト `measure.ts` を大きいリポジトリでも測れるようにした（1 つずつ測って手放す、`--runs N` の中央値、`--threads N`）。**計測は 3 回以上の中央値で比べる**（この PC では同じ計測で 2〜3 倍ぶれる）
- [x] provider の時間（NPSP）: 権限の解析・参照先の確かめの文脈・Apex の呼び出しの解析を覚えて使い回すようにした（2 回目から `apex.dataAccess` 1.5 → 0.04 秒など）
- [ ] 1 回目の provider の時間: `crossRef.labels` 1.4 秒（依存関係のグラフを作る時間）、`apex.dataAccess` 0.9 秒、`permission.objectAccess` 0.8 秒。MCP のサーバーは起動の裏で読み込むので、読み込みのあとにグラフも作っておく（先に温める）か決める（低）
- [ ] 書き込みのスレッドのテスト（[store.test.ts](../test/unit/store.test.ts)）が ttsx でスレッドの準備に 26 秒かかる。テストをビルド版で動かす形にするか、スレッドの準備を速くするか（`tsx` に替えるなど。8 章）（低）
- [ ] S5 の残り（git の変更ファイルでの絞り込み・ファイルの監視）は今はやらない（決めたこと 8）

## 2. コンポーネントの網羅

記号: ◎ = ドキュメントの provider と部品がある、○ = 一部ある、△ = 依存関係のグラフ・`find_nodes` で名前と位置だけ分かる、× = ない。

### 2.1 ファイル・フォルダ単位（単位の種類 53）

まず、どの種類でも「単位の一覧（名前・ラベル・ファイル）」と「設定値（JSON のプロパティ）」を出せる汎用の provider を作る。専用の provider は、ドキュメントとしての読みやすさが要るものから足す。

- [x] **汎用の provider**（2026-11-18）: `metadata.types`（種類ごとの数・読めなかったもの・エラーのあるもの）・`metadata.units`（すべての種類の単位の一覧。種類・名前・ラベル・説明・ファイル・読んでいない要素）・`metadata.properties`（設定値を「場所 → 値」の行で。配列の要素は名前で示し、数式・条件の行は文字列。Apex・LWC は -meta.xml だけ。機密の値は伏せる）と雛形 `metadata_inventory`（[metadata.ts](../src/analyzer/report/metadata.ts)）。これで 53 種類すべての一覧と設定値を出せる（2.1 の表の △ の種類も、専用の provider がなくても汎用の形では見せられる）
- [ ] Visualforce・Aura の `metadata.properties` は、マークアップの木がそのまま行になる（`markup.body[3].tag` など）。読みやすくするには専用の provider（使う部品・コントローラー・差し込みの一覧）を作る（2.1 の表の「コード」の行）（中）
- [ ] 大きいリポジトリ（NPSP の Profile など）で `metadata.properties` の行の数と HTML の大きさを測り、雛形 `metadata_inventory` を種類ごとに分ける例を入れるか決める（中）

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
- [x] オブジェクトの子（2026-11-18）: `object.members`（レコードタイプ・リストビュー・項目セット・コンパクトレイアウト・ボタンとリンク・ビジネスプロセス・共有の理由・アクションの上書き・検索レイアウト。1 行 1 つで、中身は「場所 = 値」の一覧）。オブジェクト定義書に「そのほかの定義」として入れた
- [ ] 項目の暗号化・データの分類（`encryptionScheme`・`securityClassification`・`complianceGroup`）、積み上げ集計の条件 `summaryFilterItems` を読む — [metadata-json-review.md](./metadata-json-review.md) 4 章（中）
- [ ] 暗黙の標準項目をオブジェクトごとに変える（`OwnerId` の有無など） — [metadata-implementation.md](./metadata-implementation.md) 9 章（低）

#### Flow・自動化

- [x] 一覧・要素と接続の図・入出力の変数・参照・オブジェクトごとの自動化の順序
- [x] 要素の中身 `flow.elements`（2026-11-18。決定の条件・割り当て・レコードの操作の対象と条件・画面の項目・アクションの引数。Flow の値は 1 つにまとめ、参照は `{!x}`）。雛形には 0 章の 4 番の `automation_overview` で入れる
- [ ] 承認プロセス・割り当て / 自動応答 / エスカレーションルール・重複 / 一致ルールの条件とアクション（2.1 と同じ。中）

#### 権限・セキュリティ

- [x] オブジェクト・項目の権限の行列、Apex・Visualforce の実行権限、権限セットグループが与える権限
- [ ] システム権限・カスタム権限・タブの表示・レコードタイプの表示・ページレイアウトの割り当て・権限セットグループの構成（中）

#### 画面

- [x] ページレイアウト・Lightning ページ・LWC の置き場所（Lightning ページだけ）
- [ ] LWC の置き場所をタブ・クイックアクションにも広げる（低）

#### ラベル

- [x] ラベルの使用箇所と使われていないラベル（`crossRef.labels`。LWC・Apex・Flow）
- [x] ラベルの定義の一覧と訳（2026-11-18。`label.definitions`。値・言語・保護・分類と、組織の翻訳（translations）にある訳・訳のない言語）。翻訳の状況の雛形に入れた
- [ ] ラベルの Visualforce での使用箇所（低）

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

| 領域               | 今の provider                                        | 雛形                                         | 足りないもの                                                                    |
| ------------------ | ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| データモデル       | ◎ `object.*`                                         | ◎ `object_definition`                        | 値セット・カスタムメタデータのレコード・外部オブジェクト                        |
| 画面               | ◎ `layout.detail`・`flexiPage.detail`・`lwc.*`・汎用 | ◎ `ui_overview`・`lwc_overview`              | アプリのタブ・ユーティリティの専用の provider `app.navigation`（低）            |
| 処理（コード）     | ◎ `apex.*`                                           | ◎ `apex_specification`                       | 呼び出しグラフ                                                                  |
| 自動化             | ◎ `flow.*`・`automation.byObject`・汎用              | ◎ `automation_overview`                      | ワークフロー・承認・各種ルールの専用の provider（条件とアクションを読みやすく） |
| セキュリティ・共有 | ◎ `permission.*`・汎用                               | ◎ `security_overview`・`permission_overview` | ロールの階層の図、グループ・キューの構成員の表                                  |
| 連携               | ○ 汎用・`crossRef.references`                        | ◎ `integration_overview`                     | イベント・メッセージチャネルの発行・購読の流れ（専用の provider）               |
| 多言語             | ○ `translation.*`・`crossRef.labels`                 | ◎ `translation_overview`                     | ラベルの定義と訳・組織の翻訳                                                    |
| 分析               | ○ 汎用                                               | ◎ `analytics_overview`                       | レポート・レポートタイプが使う項目、ダッシュボードの部品（専用の provider）     |
| 依存関係・影響     | ◎ `dependency.*`                                     | ○ `impact_analysis`                          | —                                                                               |

### 2.5 機能のまとまり（種類をまたいだ横断）

- [x] 起点（オブジェクト・クラス・LWC など）から、関わる単位を種類をまたいで集める provider `feature.scope`（依存関係のグラフを両方向に数段たどる）と、雛形 `feature_overview`（2026-11-18。[implementation-roadmap.md](./implementation-roadmap.md) 8 章の D9）
- [ ] 範囲が広くなりすぎる起点（Account など、何でも参照するもの）の扱い: 今は `depth`・`direction`・`excludeTypes` で利用者が絞る。段ごとの件数の上限や、よく使われる種類（profile・objectTranslation）を既定で外すかは、大きいリポジトリで試してから決める（中）
- [ ] 項目 × 使う場所（Apex・LWC・Flow・レイアウト・数式・権限）の行列 `crossRef.fieldUsage` / `FieldUsageMatrix`（今は LWC だけ） — [report-components-plan.md](./report-components-plan.md) 2.8（中）

## 3. 利用者が使う仕組み（雛形・文書の書きやすさ・設定・使い始め）

レポートの形を利用者が組めることが、このリポジトリの強み（決めたこと 1）。AI だけでなく、**利用者本人が JSON の文書を書いて直せる**こと、**対象リポジトリごとに設定を置けること**を、ここで扱う。

### 3.1 雛形

- [x] 2.4 の領域ごとの雛形（2026-11-18。[domainTemplates.ts](../src/report/domainTemplates.ts)。自動化・セキュリティと共有・画面・連携・分析。専用の provider がない種類は `metadata.units`・`metadata.properties` で組んだ。MCP のプロンプトにも登録し、登録したすべてのプロンプトの雛形が検証を通ることをテストで確かめる）
- [x] `feature_overview`（2026-11-18。2.5。MCP のプロンプトが範囲を計算してから、範囲の名前で絞ったカードを足す）
- [ ] 部品 `AutomationView`・`LayoutView`・`FlexiPageView` が、1 時点（status なし）でも空の「変化」の列を出す。status がないときは列を出さない（低）（高〜中。provider ができたものから）
- [ ] 大きい組織向けに、範囲ごとに文書を分ける例を雛形に入れる（決めたこと 4）（中）
- [x] 雛形を JSON のファイルとしても置く（2026-11-18。U12。`$schema` 付き。今は TypeScript の関数（[templates.ts](../src/report/templates.ts)）とプロンプトの中だけ。利用者がコピーして直せるように、`docs/catalog/templates/*.json` を `npm run catalog` で作る）（高）

### 3.2 文書（JSON）の書きやすさ（人と AI の両方）

今の文書は json-render の仕様そのままで、人が手で書くには重い: 要素を平らな `elements` に並べて id でつなぐ・props は部品のスキーマのすべてのキーを書く（使わないものも `null`）・データは `{ "$state": "/data/<名前>" }` で指す・`children` は空でも書く（[code-interface.json](./examples/report/specs/code-interface.json) は表 3 つで約 150 行）。

- [x] **省略を許す**（2026-11-18。U13）: props の省略したキーは既定値（`null` など）で埋めてから検証する。`children` も省略できるようにする。今の書き方（すべて書く）もそのまま通る（高）
- [x] **短い書き方を足す**（2026-11-18。U13。AI に出させる形は、書き方の決まりで両方を許した）: 入れ子で書ける形（`{ "type": "Card", "props": {...}, "children": [ {...}, ... ] }`。id は自動で付ける）と、データの指し方の短縮（`"rows": "@apex"` → `{ "$state": "/data/apex" }`）。読み込むときに今の形（平らな elements）に直す。AI に出させるのも短い形でよいかを確かめる（高）
- [x] **エディターの補完と検証**（2026-11-18。U12。[report-document.schema.json](./catalog/report-document.schema.json)。type ごとの props・provider ごとの args を if / then で確かめ、`${...}`・`$note`・`$state` は値として通す）: 文書の JSON Schema（今は MCP のリソース `metascope://schema/report-document` だけ）をファイルとして置き（`docs/catalog/report-document.schema.json`）、文書に `"$schema"` を書けば VS Code で部品名・props・provider 名・引数が補完される形にする。provider ごとの引数を部品・provider の組み合わせで絞った Schema にする（高）
- [ ] **YAML でも書ける**ようにする（人が書くなら JSON より短い。コメントも書ける）（中）
- [x] **MCP を使わずに HTML を作る入口（CLI）**（2026-11-18。U11。[src/cli/index.ts](../src/cli/index.ts)。`report templates / new / validate / build / data / providers` と `--repo`・`--diff`・`--compare`・`--param`。`bin/sf-metascope.mjs`）: `npx sf-metascope report build <文書> [--diff] [--compare main]`・`report validate`・`report data <provider>`（データの中身を見て列を決めるため）・`report new <雛形>`（雛形の JSON をコピー）。今はサンプルのスクリプト（[run-report.ts](./examples/report/scripts/run-report.ts)）しかない（高）
- [ ] **書きながら見る**: `report watch <文書>`（保存するたびに HTML を作り直してブラウザで開く）（中）
- [ ] **問題のメッセージを利用者に分かる形に**: 今は英語の短い文で、場所は `spec.apexTable.props.rows` の形。日本語にする（英語と選べる）、どの行かを示す、よくある誤りには直し方を出す（例: 知らない provider に近い名前の候補、部品が受け取れないデータに受け取れる部品の名前）（中）
- [ ] **書き方の手引き**（人向け）: 最小の文書から始めて、表・カード・図・文章を足していく手順と、部品・provider の早見表。今のカタログ（[report-catalog.md](./catalog/report-catalog.md)）は LLM 向けで、全部入りで長い（高）
- [ ] 列の並びとラベル（`columns`）を provider ごとに既定で持つ（今は列を書かないとすべての列が英語のキーで出る。雛形では毎回日本語のラベルを書いている）。部品の `columns` で上書きできる形のまま（中）
- [ ] 文書の形の版（`"version": 1`）を文書に持たせ、形を変えたときに古い文書を読める（直す）ようにする（中）

#### 3.2.1 部品ごとのデータ・for / if・レイアウト・処理フロー（2026-11-18 に決めた進め方。この順に進める）

エンジニアがテンプレート言語のように書けること（例: 1 つのクラスの仕様書で、`for (m : methods)` のようにメソッドごとに文章・処理フロー・SOQL を並べる）を目指す。json-render の `repeat`・`visible` は画面に出すときに展開されるため、行ごとに provider の引数を変えられない。そのため **for / if はビルドのときに展開**し、展開した後は今の検証・HTML・MCP Apps の仕組みをそのまま使う。

1. [x] **部品ごとのデータ**（2026-11-18。[implementation-roadmap.md](./implementation-roadmap.md) 8 章の U1）（高）: 部品に `"data": { "provider", "args", "diff", "compare" }` を直接書ける。ビルドが上の段の `data` に移して今の形に直す（上の段の `data` は使い回しのために残す）。`diff` / `compare` はデータごとに選べ、ビルドは出てきた比べ方ごとに入力を 1 回だけ読む（「今の状態の仕様」と「main からの変化」を 1 つの文書に並べられる）。部品ごとの比べ方を表示にも出す
2. [x] **for / if / `$note` の展開**（2026-11-18。U2。データの宣言の `where`（行の項目で絞る）も足した）（高）:
    - `"for": { "as": "m", "in": { "provider", "args", "where" } }` で、データの行ごとに要素（と子）を繰り返す。props・provider の引数の中の `${m.name}` を行の値に置き換える。入れ子の for（クラスごと → メソッドごと）も書ける
    - `"if"` で、行の値（`eq`・`neq`・`gt`・ある / ない）と、データが空かどうかで要素を出し分ける
    - 文章は上の段の `notes`（キー → markdown）に置き、`{ "$note": "${m.name}" }` で引く。AI はキーごとに文章を書くだけで済む。キーに文章がないときは「(未記入)」を出し、検証で知らせる
    - 検証は展開の前（書き方）と後（データ・props）の両方で行い、問題の場所は元の要素のキーと、何行目の繰り返しかで返す。繰り返しの数の上限（既定 200）を超えたら警告
3. [x] **レイアウトを選べる**（2026-11-18。U3）（高）: 部品 `Columns`（`"ratio": [5, 5]`・`[4, 6]`・`[7, 3]` など。子を左から順に列に入れる。狭い画面では縦に積む）。例: メソッドごとに、左に処理フロー・右に文章。for の中でも使える。今の `Grid` は等分（1〜6 列）だけ
4. [x] **処理フロー（Apex と LWC）**（2026-11-18。U4・U5）（高）: 言語に依らない部品 `CodeFlowchart`（React Flow と dagre）と、provider `apex.methodFlow`（クラス・メソッドを指定）・`lwc.methodFlow`（コンポーネント・JS のメソッド / イベントハンドラを指定）。文の木から、開始・処理・分岐（if / switch）・繰り返し（for / while）・try / catch・return / throw の要素と、つなぎ（はい / いいえ・繰り返し・例外）を作り、続く処理は 1 つの箱にまとめる。Apex は SOQL・DML、LWC は Apex の呼び出し・イベントの発行・`@wire` の箱の色を変え、ループの中の SOQL・DML に印。Apex を先に作り、LWC は同じ形で足す（2026-11-18 に決めた）
5. [x] **流れの図を足す**（2026-11-18。U6）（中）: 処理フロー（1 つの関数の中）だけでは分からない、関数・コンポーネントをまたぐ流れ
    - `lwc.eventFlow` と部品 `EventFlow`: 利用者の操作から処理まで（テンプレートのイベント → ハンドラー → Apex の呼び出し・`@wire` の再取得 / 子へのプロパティ / 親へのイベント / 画面の遷移（NavigationMixin）・トースト）。親子のコンポーネントをまたいでたどる（2.2 の LWC の親子関係の図と土台を共有）
    - `apex.callFlow` と部品 `SequenceDiagram`: メソッドから呼ぶメソッドを、クラスをまたいで depth 段たどる（トリガー → ハンドラー → サービスなど）。2.2 の Apex の呼び出しグラフの上に作る。`lwc.eventFlow` から呼ばれる Apex につなげられる
6. [x] **雛形を書き直す**（2026-11-18。U7。クラス・コンポーネント・オブジェクトを指定したときの形）（高）: `apex_specification` をメソッドごとの形に（クラスごとに概要・メンバー、メソッドごとに左に処理フロー・右に文章（`Columns`）、下にデータアクセス）。`lwc_overview` にハンドラーごとの処理フローとイベントの流れ。雛形の例として、ほかの雛形（オブジェクトごとの定義書など）にも for を使う
7. [x] **文書と道具を直す**（2026-11-18。U8。各ステップで文書・カタログ・プロンプトを直し、最後にテストとゴールデンを足した）（高）: [report-document-format.md](./report-document-format.md)・カタログ（書き方の決まり・JSON Schema）・MCP のプロンプトの手順・テスト（展開の結果が、手で展開した文書と同じ HTML になること。処理フローは、サンプルのクラス・コンポーネントで要素とつなぎのゴールデンを持つ）

- [ ] 処理フローの残り（低）: Aura のコントローラー・ヘルパーと Visualforce のコントローラー（同じ `CodeFlowchart` で）。Flow の図（`FlowDiagram`）と見た目（箱の形・色）をそろえる

#### 3.2.2 文書の使い回し

- [x] **文書の引数**（2026-11-18。U9・U10。構成の値だけに使う。CLI の `--param` は U11）（高）: 文書に `"params": { "depth": { "default": 2 } }` を書き、`${params.depth}` で使う。CLI の `--param depth=3`・MCP の `build_report` の引数で渡す
- [ ] **部分の使い回し**（中）: よく使う部分（「オブジェクトの項目のカード」など）を別のファイルに置き、`{ "use": "parts/objectFields.json", "with": { "object": "${o.name}" } }` で呼ぶ。利用者の雛形のフォルダ（3.3）に置ける
- [ ] **文章の鮮度**（中）: `notes` の文章に、書いたときのデータの指紋（行の hash）を持たせ、作り直したときにデータが変わっていたら「文章が古い可能性」を表示と検証で知らせる。コードが変わったときに、AI がどの文章を書き直せばよいかが分かる
- [x] **ドキュメントのサイト**（2026-11-18。U10。要素の `page` で for の 1 件ずつを pages/<file>.html に分け、目次に PageLink を置く）: 大きい組織で 1 つの HTML が大きくなりすぎる問題（決めたこと 4）にも効く

### 3.3 対象リポジトリ側の設定

今の設定は、MCP のサーバーを起動するときの環境変数 2 つ（`SF_METASCOPE_REPOSITORY`・`SF_METASCOPE_BASE_DIR`）だけ（[context.ts](../src/mcp/context.ts)）。対象リポジトリの中に置く設定ファイルはない。

- [ ] **設定ファイル** `sf-metascope.config.json`（または `.sf-metascope/config.json`）を対象リポジトリのルートに置けるようにする。読む順は「既定 → 設定ファイル → 環境変数 → ツールの引数」。zod で検証し、JSON Schema も置く（エディターで補完）（高）
- [ ] 設定に持つもの（案）（高）:
    - 保存先（今の `SF_METASCOPE_BASE_DIR`）・レポートの出力先（今は `<保存先>/reports/` 固定）・HTML のファイル名の付け方
    - 解析する範囲: `sfdx-project.json` の `packageDirectories` と `.forceignore` に加えて、含める / 除くパス、解析する単位の種類（使わない種類を外して速くする）
    - 比べる時点の既定（`diff` を既定にするか、`compare` の既定の `from`（例: `main`））
    - 機密の値: 伏せる種類・項目を足す / 外す、ソースの抜き出しを許すか
    - レポート: 利用者の文書と雛形を置くフォルダ（例: `docs/reports/*.json`）。MCP のプロンプト・CLI から名前で呼べるようにする。既定の言語（日本語 / 英語）・列のラベル
    - 大きさの目安（HTML の警告の 8 MB）・表の 1 ページの行数
    - 指摘（findings）のルールの有効 / 無効（4 章）
- [ ] **利用者の雛形**: 対象リポジトリに置いた文書を、組み込みの雛形と同じく一覧・プロンプトに出す（`list_report_templates` のツールを足す）。チームで同じ形のドキュメントを作れるようにする（高）
- [ ] 保存先（`.sf-metascope`）を `.gitignore` に足すことを、初めて保存したときに知らせる（今は README に書いてあるだけ）。設定ファイルとレポートの文書はコミットしてよい物、保存先はコミットしない物、と分ける（中）
- [ ] 設定の中身を返す MCP のツール・CLI（`config show`。どの値がどこから来たかも出す）（中）

### 3.4 使い始め・配布

- [ ] **配布の形を決める**: npm のパッケージとして公開するか（`npx sf-metascope ...`・MCP のサーバーの設定が `npx` 1 行で済む）、ビルド済みのものを置くか。`package.json` の `bin`・`files`・`version`・`license`（今は ISC・作者が空）を整える（高）
- [ ] **初めて使う人の手引き**（README の上の方）: MCP のクライアント（Claude Code・Claude Desktop・VS Code）ごとの設定の例、最初に作るドキュメント（`system_overview`）までの手順、よくある問題（Node の版・ビルドしていない viewer・大きいリポジトリで時間がかかる）（高）
- [ ] 初めての読み込みの進み具合を知らせる（大きいリポジトリで 100 秒かかる。今は最初のツールの呼び出しが黙って待つ。MCP の進捗の通知か、`status` のツールで「読み込み中 1,200 / 2,337」を返す）（中）
- [ ] 変更の記録（CHANGELOG）と版の付け方（保存の版・文書の形の版・ツールの名前を変えたときの扱い）（中）
- [ ] 静的な HTML（JavaScript なし。印刷・メール向け。React の `prerender`） — [implementation-roadmap.md](./implementation-roadmap.md) 2.2・4.4（低）

### 3.5 レポートの仕組みの残り

- [ ] AI の注記（annotations）を仕様に入れる（対象は `{ data, key }`。行がなければビルドで問題にする。決めたこと 3） — [report-components-plan.md](./report-components-plan.md) 1.1・3.3（中）
- [ ] 部品の見た目の調整を利用者ができる範囲を決める（色・ロゴ・表紙・目次。会社のドキュメントの体裁に合わせたい場合）（中）
- [ ] 目次とページ内のリンク（長いドキュメントで、カードの見出しから目次を作る）（中）
- [ ] 作ったレポートの一覧と作り直し（同じ文書から、リポジトリの今の状態で作り直す。`report rebuild --all`）（低）

### 3.6 読み手のための画面と書き出し

今の viewer の表は、絞り込みとページ分けだけ（並べ替え・列の出し分け・書き出しはない）。依存関係の図は Mermaid の文字のまま出る。ドキュメントを読む人・渡す先（Excel・Word で定義書を求められることが多い）を考えた改修。

- [ ] **表の並べ替えと列の出し分け**（高）: 見出しを押すと並べ替え、列の表示 / 非表示を選べる（文書の `columns` は初めの状態）
- [ ] **表を CSV / Excel で書き出す**（高）: 表ごとのボタン。定義書を Excel で渡す運用に合わせる。CLI でも `report export --format xlsx`（文書のすべての表を 1 ブックのシートに）
- [ ] **文書を Markdown / Word で書き出す**（中）: 文章・表・図（画像）を、リポジトリに置く Markdown や、渡すための Word にする。Markdown ならコードと一緒にレビューできる
- [ ] **依存関係の図を図として描く**（高）: `DiagramText`（文字）に加えて、`dependency.graph` を React Flow で描く部品（ほかの図と同じ見た目。種類で色分け・押すと強調）。Mermaid の文字は書き出し用に残す
- [ ] **リンク**（中）: 表・図の単位の名前から、同じ文書の該当のカード・別のレポートへ飛ぶ。ファイルの列から VS Code（`vscode://file/...`）か GitHub などのリポジトリの URL（設定ファイルに URL の形を書く。3.3）を開く
- [ ] **API 名とラベルの切り替え**（中）: 業務の担当者向けに、オブジェクト・項目をラベルで出す（API 名は小さく添える）
- [ ] **印刷・PDF**（中）: 印刷用の CSS（カードの途中で改ページしない・表はすべての行・図は収まる大きさ）。3.4 の静的な HTML と合わせる
- [ ] **文書の中の検索**（低）: すべてのカード・表をまたいで探す（今は表ごとの絞り込みだけ）

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
- [ ] 機密の値: 連携の provider（作ったら）で、伏せる種類の値が出ないことのテスト（汎用の provider `metadata.properties` は 2026-11-18 にテストを足した）
- [x] for / if の展開のテスト（2026-11-18。[expand.test.ts](../test/report/expand.test.ts)）: 展開した文書が手で展開した文書と同じになること、入れ子の for、行が 0 件、上限を超えたとき、`$note` のキーがないとき、問題の場所が元のキーで返ること（3.2.1）
- [ ] 文書の書きやすさのテスト: 省略した文書・短い書き方・YAML が、すべて書いた文書と同じ HTML になること。雛形の JSON のファイルが検証を通ること（3.1・3.2）
- [ ] 設定ファイルのテスト: 読む順（既定 → 設定ファイル → 環境変数 → 引数）、誤った設定のメッセージ（3.3）
- [ ] 対応する Node の版で動くことを CI で確かめる（今は 24 だけ。`engines` は `>=24.15`）
- [ ] 依存関係の更新の仕組み（Dependabot など）と、`npm audit` を CI に入れるか
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
- [ ] `ttsx` / `ttsc` を `tsx` などに替える、`recharts`・`elkjs`（必要になったら） — [implementation-roadmap.md](./implementation-roadmap.md) 2 章
- [ ] PostgreSQL と `kysely`（チームで共有するサーバーの形が要るとき）、`node:sqlite` で困ったら `better-sqlite3`、DB から読んだ木を検証するスキーマ、定義・参照の SQL の表 — 同 5 章（低）

## 9. 決めたこと（2026-11-17）

前提: 第一の目的はドキュメントの作成とコードの理解で、差分と影響の調査は補助。レポートの形は固定せず、利用者が組めることを強みにする。

| #   | 項目                        | 決めたこと                                                                                                                                                                                                                                                                                                                                                                                          | 書いた場所                                                          |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | レポート仕様の範囲          | 雛形はいくつか用意して使えるようにする（ドキュメントを主に、差分を補助に）。形は固定せず、AI に組ませるか利用者が書くかは利用者に任せる。製品の中心はカタログと検証                                                                                                                                                                                                                                 | [report-components-plan.md](./report-components-plan.md) 5 章       |
| 2   | 既定と差分                  | 既定は今の状態のすべて（1 時点・status なし）。差分は `diff` / `compare` のときだけ。差分だけの provider は `requiresComparison`（実装済み）                                                                                                                                                                                                                                                        | [implementation-roadmap.md](./implementation-roadmap.md) 冒頭・8 章 |
| 3   | AI の注記の対象             | `{ data, key }`（行のキー）。ビルドで行があるかを確かめる（未実装。3 章）                                                                                                                                                                                                                                                                                                                           | report-components-plan 5 章                                         |
| 4   | 1 つの HTML に埋め込むか    | 埋め込みのまま。8 MB を超えたら警告。絞り込みは範囲の引数（実装済み）。範囲ごとに分ける例を雛形に（未実装。3 章）                                                                                                                                                                                                                                                                                   | report-components-plan 5 章                                         |
| 5   | 翻訳の言語                  | 既定はすべて。`languages` で絞る（実装済み）                                                                                                                                                                                                                                                                                                                                                        | report-components-plan 5 章                                         |
| 6   | 権限の表                    | 既定は全件。差分は `diff`（と `onlyChanged`）（実装済み）                                                                                                                                                                                                                                                                                                                                           | report-components-plan 5 章                                         |
| 7   | HTML・XML・CSS の IR        | 入れない。XML は `RecordSpec` に整理する                                                                                                                                                                                                                                                                                                                                                            | [implementation-roadmap.md](./implementation-roadmap.md) 7 章       |
| 8   | Q2・S5 の残り               | NPSP の計測で、起動し直した読み込みのほとんどは DB から木を組み直す時間だった。ドキュメントはすべての種類を読むので Q2 は効きにくい。S5 の残りはやらない                                                                                                                                                                                                                                            | implementation-roadmap 8 章 M1・M2                                  |
| 9   | Apex の解析の順番           | クラスの概要 → データアクセス → 呼び出しグラフ。findings は後（概要・データアクセスは実装済み）                                                                                                                                                                                                                                                                                                     | [apex-json-analysis.md](./apex-json-analysis.md) 7 章               |
| 10  | 型の解決・標準クラス        | リポジトリの中は継承と戻り値の型までたどる。標準クラスはよく使うものだけ（未実装。2.2）                                                                                                                                                                                                                                                                                                             | apex-json-analysis 7 章                                             |
| 11  | findings                    | 優先度を下げる。コードに書き、引数で切り替え、メタデータとまたがるルールに絞る。PMD と重ねない                                                                                                                                                                                                                                                                                                      | apex-json-analysis 7 章                                             |
| 12  | 画面のスナップショット      | 方式 A を先に（実装済み）。JS は既定では実行しない。方式 B は明示したときだけ、隔離して                                                                                                                                                                                                                                                                                                             | [lwc-snapshot-plan.md](./lwc-snapshot-plan.md) 7 章                 |
| 13  | `lightning-base-components` | 今は使わず、スタブで描く                                                                                                                                                                                                                                                                                                                                                                            | lwc-snapshot-plan 7 章                                              |
| 14  | 選択リスト値の並び順        | ドキュメントでは定義の順。`diff` のときは「並び順が変わった」印を 1 つ（実装済み）                                                                                                                                                                                                                                                                                                                  | [metadata-implementation.md](./metadata-implementation.md) 9 章     |
| 15  | ir-types の後回しの 5 件    | 単独ではやらず、その部分を触るときに一緒に直す                                                                                                                                                                                                                                                                                                                                                      | [ir-types.md](./ir-types.md) 6 章                                   |
| 16  | 保存の作り                  | 案 A（1 ノード 1 行）のまま。単位ごとの解析結果をかたまりで持つ案は採らない（2026-11-17）                                                                                                                                                                                                                                                                                                           | implementation-roadmap 8 章 M2                                      |
| 17  | 文書の役割                  | 文書は構成の定義。利用者・AI が構成とデータの種類を決め、AI がその構成どおりに作る。個々のデータ（どのクラス・メソッド・オブジェクトか）は利用者が指定しない（for / where で行から取る）。全件で大きくなるときは 1 件 1 ページに分ける。雛形・プロンプトは個々のデータを引数に取らず、`params` は構成の値だけ。起点が要る補助の雛形（影響の調査・機能のまとまり）は起点を自動で決める（2026-11-18） | implementation-roadmap 8 章 U10、report-document-format の冒頭      |

未決のまま: `DiffOf` の型が深くなりすぎたときにどこで止めるか（[apex-json-analysis.md](./apex-json-analysis.md) 7 章）。

## 10. 未確認（確かめていないこと）

- Flow の画面の項目の `objectFieldReference`（動的な項目）、Flow のアクションの引数の名前と Apex の `@InvocableVariable` の突き合わせ — [metadata-json-review.md](./metadata-json-review.md) 4 章
- Profile のパスワードの方針・セッションの設定、共有セット・テリトリー、Lightning のメールテンプレート（`{{{Recipient.Name}}}`）・Visualforce のメールテンプレート（`messaging:`）が単位・参照になっていない — 同 4 章
- 数式の演算子の一覧を Salesforce の文書で確かめていない — 同 6.1
- 組織の設定（settings）を種類ごとにどこまで読むか、LWC のバンドルの `.svg` などのファイルの扱い、祖先のフォームのオブジェクトが分からない `field:Name` のグラフでの見え方 — [json-gaps.md](./json-gaps.md) 2.2・3 章・4.2
- ほかの単位を読んで parse する種類がないか — [save-format-plan.md](./save-format-plan.md) 3.2
- `DiffOf` の型が深くなりすぎていないか（今の typed.ts） — [apex-json-analysis.md](./apex-json-analysis.md) 7 章
