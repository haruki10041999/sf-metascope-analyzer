# やることリスト（リポジトリ全体）

リポジトリ全体でやることの一覧。解析部分の詳しい計画は [analysis-plan.md](./analysis-plan.md)、レポートの計画は [report-components-plan.md](./report-components-plan.md)。終わったら消すか、`[x]` にする。

優先度: **高** = 次にやる・ほかの作業の前提、**中** = その次、**低** = 後で。

## 1. 道具・品質（高）

- [ ] テストとサンプルのスクリプトを型チェックに入れる（`tsconfig.test.json`。今の `tsconfig.json` は `src` だけを見ている）
- [ ] 型チェックで出るテストのエラーを直す（`test/apex_IR/*`・`test/converter/output-types.test.ts`・`convert-exclude-error.test.ts`・`lwc_IR/visitor.test.ts`・`parser/metadata-parse.test.ts` など。古い API の型のまま）
- [ ] `src/analyzer/types/apex_IR/restVisitor/creator.ts` の型エラー（`ErrorTypeClass` が `commonVisitor` にない）
- [ ] 以前から失敗しているテスト 6 件を直す（Apex の `locationValue`・`typeRef`・JSON 出力（構文のサンプル）。期待値が古いのか実装の不具合なのかを分ける）
- [ ] 改行コードを決める（`.gitattributes`）。Prettier の `endOfLine: crlf` と、リポジトリのファイル（多くが LF）が合わず、整形のたびに改行コードだけの差分が出る
- [ ] LWC の検証スクリプトの型エラー（`docs/examples/lwc/scripts/run-library-parse.ts`・`verify-erase-types.ts`。Babel のプラグインの型）
- [ ] CI（型チェック・テスト・Prettier の確認）

## 2. 解析（高〜中。詳しくは [analysis-plan.md](./analysis-plan.md)）

- [ ] 単位の種類（`UnitType`）と `Repository` で、parser・worker・Diff・解析の流れを 1 つにする（analysis-plan 2 章）
- [ ] 保存データの版。オブジェクト・翻訳のキー（書いた順の objectKey）と保存名（接頭辞なし）をそろえる（analysis-plan 1.1・1.2・5.2）
- [ ] 定義・参照の取り出しを全種類で同じ形にし、依存関係のグラフを作る（依存先・被依存・影響・依存の差分・ない参照・使われていないもの・循環。analysis-plan 3 章）
- [ ] Apex の参照（SOQL / SOSL / DML の対象・呼び出し・型）。[apex-json-analysis.md](./apex-json-analysis.md)
- [ ] 数式の参照の取り出し（数式項目・入力規則・既定値・ワークフロー・Flow・レポート）
- [ ] git の範囲からの before / after（変わった単位だけ parse。名前の変更は git の rename で対応付ける）
- [ ] SFDX の分解された形式（`decompose*`: 権限セット・ラベル・ワークフロー・共有ルールなど）、メタデータ API の形式、複数のパッケージディレクトリ・`.forceignore`
- [ ] 名前の変更の推定（項目・メソッドなど、ファイルの中の要素）
- [ ] 大きいリポジトリ（変わった単位だけ parse、保存済みの解析結果の使い回し、Profile の大きさの確認）

## 3. レポート・viewer（中。詳しくは [report-components-plan.md](./report-components-plan.md)）

- [ ] **レポート HTML にデータが入らない不具合**を直す（`htmlBuilder` の `define` 名・`main.tsx`・`index.html` の名前の食い違い）
- [ ] レポート仕様の型・検証・ビルド（`ReportSpec`）と、汎用のコンポーネント（`Section`・`DataTable`・`Callout`・`SourceSnippet`・`Graph`・`Matrix` など）
- [ ] 種類ごとのコンポーネント（オブジェクト・Apex・LWC・権限・Flow・画面・横断）。data provider は権限・Flow・画面・ラベル・参照・指摘の一覧が済（`src/analyzer/report/`）
- [ ] 本文のテキスト（メール・Visualforce・Aura の JS）は git の行の差分で見せる（analysis-plan 4 章）
- [ ] 決めること（report-components-plan 5 章）: レポート仕様を skill に書かせる範囲、AI の注記の対象の書き方、データを 1 つの HTML に埋め込むか、権限の表の既定の範囲、翻訳の言語の扱い
- [ ] 画面のスナップショット（SSR）。[lwc-snapshot-plan.md](./lwc-snapshot-plan.md)

## 4. MCP サーバー（中）

- [ ] ツールを置き換える: `list_report_components`・`get_report_data`・`build_report`（今の `save_objects`・`analyze_objects` はオブジェクトだけ）
- [ ] 依存関係の問い合わせ（「この項目を使っているもの」「この変更の影響」）
- [ ] AI に渡すときに伏せる値（指定ログイン情報の URL・ユーザー名、カスタムメタデータのレコードの値など）

## 5. ドキュメント（中）

- [ ] ルートの `README.md` を今の状態に合わせる（オブジェクトだけの説明のまま。MCP のツール名 `render_object_report` も古い）
- [ ] 各 `*-implementation.md` を、共通化（analysis-plan 2 章）が終わったら 1 つの流れの説明にまとめ直す
- [ ] JSON の型の説明（属性ごとの説明）は一度削除した。必要になったら、型から生成する形で作り直す

## 6. サンプル・確かめ方（低）

- [ ] 実際の組織に近いリポジトリ（公開されているサンプルアプリなど）で、読めない要素・`skippedElements`・指摘の誤検出を洗い出す
- [ ] 分解された形式・メタデータ API の形式のサンプル
- [ ] 依存関係の期待値のテスト（サンプルのすべての種類をまたぐもの）

## 7. ビルド・配布（低）

- [ ] `npm run build`（`ttsc` + Vite）と `build:node` の確認。worker_threads のビルド版での動作
- [ ] `package.json` の説明・キーワード（「React Flow visualization」など、今の内容と合っていない）
