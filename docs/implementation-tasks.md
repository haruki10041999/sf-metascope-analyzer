# 実装のタスク一覧

2026-11-18 に作成。実装の作業を、コードの場所ごとに並べた一覧です。

- **[todo.md](./todo.md) との関係**: todo は「何をそろえるか」の観点（網羅・使い始め・決めたこと）で並べています。この一覧は、それを「どこを直すか」で並べ直したものです。
- **この一覧にしかないもの**: todo にまだない改修・追加（`新規` と書いたもの）を含みます。今回の作業（3.2.1〜U13）で分かった弱いところと、コードを見て気づいたことです。
- **書き方**: 各行は「内容（優先度）。場所。出典」です。優先度は高・中・低、出典の `todo 2.2` は todo の節です。
- **前提**: レポートの方針（文書は構成の定義。個々のデータは指定しない。[report-document-format.md](./report-document-format.md) の冒頭）に合わせています。

## 1. 解析（`src/analyzer/parser`・`processor`・`types`）

### 1.1 Apex

- [ ] **型の解決**: リポジトリの中の継承とメソッドの戻り値の型をたどる（`getAccount().Name` が参照にならない）。標準クラスはよく使うものだけを一覧にする（高）。場所: `processor/Apex`。出典: todo 2.2
- [ ] **インターフェース・継承を通した呼び出しの解決**: `handler.handle()` のように型がインターフェース・親クラスのとき、実装しているクラスを候補として返す。`apex.callFlow` のシーケンス図と呼び出しグラフで使う（高）。場所: `processor/Apex/calls.ts`・`report/apexCallFlow.ts`。出典: 新規（U6 の弱いところ）
- [ ] **オーバーロードの区別**: 呼び出しの引数の数（分かれば型）で、同じ名前のメソッドのどれを呼んでいるかを決める。今の `apex.callFlow` は名前だけで中をたどる（中）。場所: `processor/Apex/calls.ts`・`report/apexCallFlow.ts`。出典: 新規
- [ ] **プロジェクトをまたぐ解析**: シンボル表・使われていないメソッド・SObject の利用表・トリガーとハンドラーの対応・テストクラスとテスト対象の対応（中）。出典: todo 2.2・apex-json-analysis
- [ ] **JSON にあるが使っていない情報**: `@AuraEnabled(cacheable)` と LWC の `@wire` の突き合わせ、公開 API（`@RestResource` など）の一覧、`@TestVisible`・SeeAllData、`@future(callout)`、`WITH SECURITY_ENFORCED`（中）。出典: todo 2.2
- [ ] **動的な参照**: 動的 SOQL（リテラルの文字列）、`Schema.getGlobalDescribe().get('X')`・`describeSObjects`、`rec.get('Field__c')` / `put`、変数で渡した `checkPermission` など（中）。出典: todo 6 章
- [ ] **Diff の型**: `triggerCase` に fields を持たせる、`notSet` の変化、annotation の Diff を分けるか（低）。出典: todo 4 章
- [ ] **名前の変更の推定**: 項目・メソッドなどファイルの中の要素で、今は removed + added になるものを「名前の変更」と推定し、依存の差分でも使う（低）。出典: todo 4 章
- [ ] **SOSL の別名**: SOSL・項目の一覧で、関数のあとの別名（`TOLABEL(x) alias`）を JSON に出す（低）。出典: todo 7 章
- [ ] **IR の型の後回しの 5 件**: その部分を触るときに一緒に直す（低）。出典: todo 7 章

### 1.2 LWC・Aura・Visualforce

- [ ] **テンプレートの式の値の解決**: `field-name={nameField}` を JS の値・import から解決する。`@salesforce/contentAssetUrl`・名前空間つきの label・`@salesforce/userPermission` などの参照も足す（中）。出典: todo 6 章
- [ ] **TS の型の名前をバンドルをまたいで解決**し、型注釈のない項目の型を推論する（必要になったら。低）。出典: todo 2.2
- [ ] **Aura の参照**: JS の参照（`component.get('c.method')`・`$A.get('e.c:event')`）と `aura:handler`、`{!v.x}` / `{!c.handle}` が実在するか、JS の中身の解析（中）。出典: todo 6 章
- [ ] **Visualforce・Aura の専用の解析**: 使う部品・コントローラー・差し込みの項目（`{!Account.Name}`）を取り出す。今は `metadata.properties` でマークアップの木がそのまま行になる（中）。出典: todo 2.1・6 章

### 1.3 メタデータ

- [ ] **オブジェクトの参照の穴**: 主従関係・積み上げ集計の対象・制御項目・`lookupFilter` の項目を参照にする。`searchLayouts`・`webLinks` の URL と数式の中の項目も参照にする（中）。出典: todo 6 章
- [ ] **レイアウトの残り**: `customLink`・`miniLayout`・`summaryLayout`・`feedLayout` を読む（低）。出典: todo 6 章
- [ ] **Flow などの参照の残り**: Flow の `submit`（承認プロセス）、Id を直接書いたカスタム通知、レポートタイプの関係をたどった列、重複ルールの条件の項目（中）。出典: todo 6 章
- [ ] **項目の属性の残り**: 暗号化・データの分類（`encryptionScheme`・`securityClassification`・`complianceGroup`）、積み上げ集計の条件 `summaryFilterItems`（低）。出典: todo 2.2
- [ ] **暗黙の標準項目をオブジェクトごとに変える**（`OwnerId` の有無など。低）。出典: todo 2.2
- [ ] **パッケージディレクトリの重なりと翻訳の形式**: 同じ種類・同じ名前の単位が複数のパッケージディレクトリにあるときの扱い。翻訳のメタデータ API の形式（`.objectTranslation`）も読む（中）。出典: todo 2.1

### 1.4 解析の作りの整理

- [ ] **provider が `Repository` を直接読む**ようにする（`snapshotInputOf` の変換をやめる）。provider の単位の status を構造の Diff に寄せる（中）。出典: todo 7 章
- [ ] **オブジェクトの子を `RecordSpec` に移す**: 入力規則・Web リンク・共有の理由など、表で書けるもの（中）。出典: todo 7 章
- [ ] **参照先の確かめを外す**: 種類ごとの解析の関数から外し、`MetadataContext`・`ReferenceInputs` を整理する。指摘の形は「単位の id + 行の sourceKeys」にそろえる（中）。出典: todo 7 章
- [ ] **最初の provider の時間を短くする**: `crossRef.labels` 1.4 秒など、1 回目の呼び出しの時間（低）。出典: todo 1 章

## 2. provider（`src/analyzer/report`）

### 2.1 新しく足す provider

- [ ] **呼び出しグラフとクラス間の依存**: `apex.callGraph`・`apex.classDependencies`。`apex.callFlow`（シーケンス）と同じ索引から作れる（高）。出典: todo 2.2
- [ ] **LWC の親子関係の図**: `lwc.componentTree`。`lwc.eventFlow` の親子のたどりを使い回す（高）。出典: todo 2.2
- [ ] **項目 × 使う場所の行列**: `crossRef.fieldUsage`（Apex・LWC・Flow・レイアウト・数式・権限）と、LWC の `lwc.fieldUsage`（中）。出典: todo 2.2・2.5
- [ ] **メトリクス**: `apex.metrics`（文の数・循環的複雑度・最大のネスト・SOQL / DML の数・呼び出しの数）。処理フローの箱と線から数えられる（中）。出典: todo 2.2
- [ ] **LWC の Apex の呼び出しの一覧**: `lwc.apexCalls`（中）。出典: todo 2.2
- [ ] **自動化の中身**: 承認プロセス・割り当て / 自動応答 / エスカレーションルール・重複 / 一致ルールの条件とアクションの専用の provider（中）。出典: todo 2.3
- [ ] **権限の残り**: システム権限・カスタム権限・タブの表示・レコードタイプの表示・ページレイアウトの割り当て・権限セットグループの構成（中）。出典: todo 2.3
- [ ] **本文のテキストの表示**: メール・Visualforce・Aura の JS（中）。出典: todo 2.4
- [ ] **差分の provider**（補助）: `object.fieldDiffs`・`apex.diffs`・`lwc.diffs`・`lwc.publicApiChanges`・`change.files`・`change.summary`・`translation.diffs`（中〜低）。出典: todo 4 章
- [ ] **チェックの provider**（補助）: `lwc.findings`・`apex.findings`（メタデータとまたがるルールに絞る。PMD と重ねない。中〜低）。出典: todo 4 章
- [ ] **画面のスナップショット**の方式 B（`lwc.snapshot`。明示したときだけ。低）。出典: todo 2.4

### 2.2 今ある provider の改修

- [ ] **列の既定**: 列の並びと日本語のラベルを provider ごとに持つ。今は `columns` を書かないと英語のキーで出る（中）。場所: `registry.ts`・`catalog.ts`。出典: todo 3.2
- [ ] **`apex.outline` に `signature` の列を足す**: `name(引数の型)` の列があれば、for の中で `"signature": "${m.signature}"` と書ける。今は `"${m.name}(${m.params})"` を組み立てている（中）。出典: 新規
- [ ] **`metadata.units` などの行にノードの id を持たせる**: `apexClass:Name` の形で持てば、for の行から `feature.scope`・`dependency.*` の targets にそのまま渡せる。今は `"object:${o.object}"` を組み立てている（中）。出典: 新規
- [ ] **引数の名前と値の形をそろえる**: `components` の `c/` の有無、`classes`・`members` の書き方を provider の間でそろえる（低）。出典: 新規
- [ ] **`object.list` の種類の分け**: カスタム設定・カスタムメタデータ型・プラットフォームイベントを分ける。`feature_overview` の起点（今は `objectType: custom`）を選びやすくする（中）。出典: 新規
- [ ] **`feature.scope` の範囲の制御**: 何でも参照する起点（Account など）で範囲が広くなりすぎる。段ごとの件数の上限や、よく使われる種類を既定で外すかを決める（中）。出典: todo 2.5
- [ ] **処理フローの分類を、解析の結果で決める**: SOQL / DML / HTTP / dispatchEvent などを、文の文字のパターンでなく呼び出しの解析の結果（`ApexCallInfo.callType`・`LwcCallInfo.callType`）で決める。今は同じ名前の自作メソッドを誤って分類しうる（高）。場所: `apexFlow.ts`・`lwcFlow.ts`。出典: 新規（U4・U5 の弱いところ）
- [ ] **処理フローの対象を広げる**: Apex のプロパティの get / set の本体と、初期化ブロック（`static { }`・`{ }`）も描く（中）。場所: `apexFlow.ts`。出典: 新規
- [ ] **LWC の Promise の流れ**: `then` / `catch` / `finally` のチェーンを、処理フローの分岐として描く（`LwcPromiseUseInfo` はある。中）。場所: `lwcFlow.ts`。出典: 新規
- [ ] **JS の switch の中の break**: 繰り返しの中の switch で、case の途中（if の中など）の break を switch を抜けるものとして描く。今は繰り返しを抜ける線になる（低）。場所: `codeFlow.ts`（switch の文脈を持つ）。出典: 新規
- [ ] **大きいメソッドの処理フロー**: 箱の数の上限と、繰り返し・try の単位での折りたたみ（中）。場所: `codeFlow.ts`。出典: 新規
- [ ] **`lwc.eventFlow` の線を足す**: `@wire` のデータがテンプレートで使われる所、親から子へのプロパティの受け渡し（`@api` の属性）、画面の遷移先（`pageType` と `objectApiName`）（中）。場所: `lwcEventFlow.ts`。出典: 新規
- [ ] **処理フロー・流れの図の比べる時点**: 変わった箱に色を付ける（補助。低）。出典: 新規
- [ ] **Visualforce・Aura の処理フロー**: Aura のコントローラー・ヘルパーと Visualforce のコントローラーも、同じ `CodeFlowchart` で描く（低）。出典: todo 3.2.1
- [ ] **LWC の置き場所を広げる**: タブ・クイックアクションも置き場所に含める（低）。出典: todo 2.4
- [ ] **ラベルの使用箇所**: Visualforce での使用箇所も出す（低）。出典: todo 2.4

## 3. 部品と viewer（`src/report/catalog.ts`・`src/viewer`）

### 3.1 表

- [ ] **並べ替えと列の出し分け**（高）。出典: todo 3.6
- [ ] **CSV / Excel への書き出し**: 表ごとのボタン（高）。出典: todo 3.6
- [ ] **status のない「変化」の列を出さない**: `AutomationView`・`LayoutView`・`FlexiPageView` が、1 時点でも空の「変化」の列を出している（中）。出典: todo 3.1
- [ ] **API 名とラベルの切り替え**（中）。出典: todo 3.6

### 3.2 図

- [ ] **依存関係の図を図として描く**: 今の `DiagramText`（Mermaid の文字）に加えて、React Flow で描く部品を作る（高）。出典: todo 3.6
- [ ] **差分の木**: `DiffTree`、ソースの before / after の並列表示（補助。低）。出典: todo 4 章
- [ ] **`CodeFlowchart` の改修**（中）。出典: 新規
    - 繰り返しの戻り線が箱をまたいで交差する。dagre の線の向きを変える
    - 箱を押したときのソースを図の横に出す
    - 図の中を検索できるようにする
- [ ] **`SequenceDiagram` の改修**（中）。出典: 新規
    - 呼び出しの活性区間と返り値を描く
    - 長い図を段ごとに折りたたむ
    - 横に動かしたときに参加者の見出しを固定する
- [ ] **`EventFlow` のまとまり**: 箱をコンポーネントごとの枠でまとめる（中）。出典: 新規
- [ ] **Flow の図と見た目をそろえる**: `FlowDiagram` と `CodeFlowchart` の箱の形と色（低）。出典: todo 3.2.1

### 3.3 ページと目次

- [ ] **`PageLink` を一覧で並べる**: 表や複数の列で並べる。今は 1 件 1 行で縦に長い（中）。出典: 新規（U10 の気になる点）
- [ ] **ページの間のリンク**: 単位の名前（シーケンス図のクラス名など）から、その単位のページへ飛ぶ。ファイルの列から VS Code・GitHub を開く（中）。出典: todo 3.6 + 新規
- [ ] **MCP Apps の画面でページを開く**: 今は目次しか出せない。ページも結果に含め、画面の中で切り替える（中）。出典: 新規（U10 の気になる点）
- [ ] **ページの中の目次**: カードの見出しから作る（中）。出典: todo 3.5

### 3.4 そのほか

- [ ] **`Card` と表をまとめた部品**: 表 1 つに 2 要素が要るのを減らす（中）。出典: 新規（U13 の残り）
- [ ] **部品の説明を日本語でも出す**: カタログの部品・props の説明は今は英語（低）。出典: 新規
- [ ] **印刷・PDF と静的な HTML**（中〜低）。出典: todo 3.4・3.6
- [ ] **文書の中の検索**（低）。出典: todo 3.6
- [ ] **見た目の調整**: 色・ロゴ・表紙を、利用者がどこまで変えられるかを決める（中）。出典: todo 3.5

## 4. ビルドと文書（`src/builder`・`src/report`）

### 4.1 速さと大きさ

- [ ] **where だけ違う同じデータを使い回す**: provider の結果を（provider・引数・比べ方）の単位で覚え、where は覚えた結果を絞るだけにする。今は覚えるキーに where を含むので、for の行ごとに同じ provider を実行し直す（Apex の仕様書のメソッドごとの処理フロー・データアクセスなど）（高）。場所: `reportBuilder.ts` の `sourceRunner`。出典: 新規
- [ ] **同じデータを 1 つにまとめて埋め込む**: 同じ結果を別の名前で何度も埋め込まない（中）。場所: `reportBuilder.ts`・`pages.ts`。出典: 新規
- [ ] **大きい文書のビルドの進み具合を知らせる**: NPSP の Apex の仕様書（約 1,000 ページ）の時間を測る（中）。出典: 新規

### 4.2 書き方を足す

- [ ] **行の中の配列を for で回す**: `"in": "${m.items}"` で、for の行の中の配列（と行列の rows）を回す。今の `in` はデータの宣言か名前だけ（中）。場所: `expand.ts`。出典: 新規
- [ ] **for の並べ替え**: `"sort": "name"` など（中）。場所: `expand.ts`。出典: 新規
- [ ] **where の比べ方を増やす**: 否定・含む・前方一致・数の比較。今は値が同じか（配列ならどれか）だけ（中）。場所: `reportBuilder.ts` の `filterRows`。出典: 新規
- [ ] **`${` をそのまま書くエスケープ**: `$${` など（低）。場所: `expand.ts`。出典: 新規
- [ ] **ページの入れ子**: クラスのページの中に、メソッドのページを作る（低）。場所: `pages.ts`。出典: 新規
- [ ] **ページのファイル名**: 大文字・小文字だけ違う名前（Windows で重なる）と、種類が違う同じ名前を区別する（中）。場所: `pages.ts`。出典: 新規
- [ ] **部分の使い回し**（`use` / `with`。中）。出典: todo 3.2.2
- [ ] **YAML でも書ける**（中）。出典: todo 3.2
- [ ] **文書の形の版**（`"version": 1`。中）。出典: todo 3.2

### 4.3 文章（notes）

- [ ] **notes のキーの一覧を出す**: 文書を展開して、書くべきキー・書いたキー・余ったキーを返す。AI が行ごとの文章を書くときの手がかりにする。MCP のツール（`list_note_keys`）と CLI（`report notes <文書>`）（高）。出典: 新規
- [ ] **notes を別のファイルに置く**: 構成（文書）と文章を分ける（`notes.json` や Markdown のファイル）（中）。出典: 新規
- [ ] **文章の鮮度**: データの指紋で「文章が古い可能性」を知らせる（中）。出典: todo 3.2.2
- [ ] **AI の注記**（annotations）（中）。出典: todo 3.5

### 4.4 問題のメッセージ

- [ ] **日本語にする**（英語と選べる）。どの行かを示し、よくある誤りには直し方を出す（中）。出典: todo 3.2

## 5. CLI と MCP（`src/cli`・`src/mcp`）

- [ ] **`report watch`**: 保存するたびに作り直す（中）。出典: todo 3.2
- [ ] **`report export`**: Excel・Markdown・Word への書き出し（3.1 の表の書き出しと一緒に。中）。出典: todo 3.6
- [ ] **`report notes`**: 4.3 の notes のキーの一覧（高）。出典: 新規
- [ ] **CLI の引数を足す**: `--threads`・`--quiet`・`--json`（警告も JSON で出す）（低）。出典: 新規
- [ ] **MCP で雛形を返すツール**: `list_report_templates` と雛形の JSON を返すツール。利用者の雛形も同じ一覧に出す（高）。出典: todo 3.3 + 新規
- [ ] **設定ファイル** `sf-metascope.config.json` と `config show`（高）。出典: todo 3.3
- [ ] **初めての読み込みの進み具合**: MCP の進捗の通知か `status` のツール（中）。出典: todo 3.4
- [ ] **保存先の `.gitignore` を知らせる**（中）。出典: todo 3.3
- [ ] **配布の形**: npm で公開し、`bin`・`files`（`docs/catalog` の JSON Schema と雛形を含める）・`version`・`license` を整える（高）。出典: todo 3.4 + 新規（`report new` の `$schema` が `docs/catalog` を指す）
- [ ] **作ったレポートの一覧と作り直し**: `report rebuild --all`（低）。出典: todo 3.5

## 6. 品質（テスト・CI・道具）

- [ ] **画面のテスト**: viewer をブラウザで描き、画面写真の差分を取る（Playwright など）。今は SSR の文字列と、手で撮った画面写真だけ（中）。出典: 新規
- [ ] **サンプルの出力を作り直す**: `docs/examples/report/output` を今の雛形で作り直すスクリプトにする。雛形が 1 件 1 ページになり、今の出力は古い（中）。出典: 新規
- [ ] **大きいリポジトリのゴールデン**: NPSP の一部で、処理フロー・流れの図の箱と線を確かめる（低）。出典: 新規
- [ ] **書き込みのスレッドのテストを速くする**（ttsx で 26 秒）。出典: todo 1 章
- [ ] **CI**: GitHub での最初の実行、`package-lock.json` と `npm ci`、Node の版、Dependabot・`npm audit`（中）。出典: todo 5 章
- [ ] **改行コード**: 次のコミットで `git add --renormalize .` をかける（高）。出典: todo 5 章
- [ ] **一時ファイルを片付ける**: `tmp-lwc-baseline.ts`・`test/_count_nodes.tmp.ts`（低）。出典: todo 5 章
- [ ] **テストの残り**（中〜低）。出典: todo 5 章
    - S3 の key で比べるのを省いた差分が、すべて比べた差分と同じこと
    - Apex の全 Diff を zod で検査すること
    - 設定ファイル・YAML のテスト
    - 新しい provider のテストの決まり
- [ ] **実際の組織での洗い出し**: NPSP などで、読めない要素・`skippedElements`・指摘の誤検出を洗い出す（中）。出典: todo 5 章
- [ ] **サンプルのスクリプトを 1 つにまとめる**（run-diff・run-parse など。低）。出典: todo 7 章
- [ ] **網羅の表を登録表から作る**: todo 2.1〜2.4 の表を、`npm run catalog` で作る（低）。出典: todo 8 章
