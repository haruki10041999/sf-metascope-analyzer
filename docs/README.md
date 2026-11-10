# docs

| 分類       | 文書                                                       | 内容                                                                                                 |
| ---------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| やること   | [todo.md](./todo.md)                                       | リポジトリ全体のやることリスト                                                                       |
|            | [analysis-plan.md](./analysis-plan.md)                     | 解析部分で今後やること（共通化・処理の流れ・依存関係・git diff との役割分担）                        |
|            | [report-components-plan.md](./report-components-plan.md)   | レポートのコンポーネントと data provider の計画                                                      |
| 共通       | [commons.md](./commons.md)                                 | Apex・LWC・メタデータで共通の部品と、新しい種類を足すときの手順                                      |
| Apex       | [apex-implementation.md](./apex-implementation.md)         | 実装の全体像（単位・構成・Diff）                                                                     |
|            | [apex-json-analysis.md](./apex-json-analysis.md)           | JSON の解析（宣言・SOQL / DML・呼び出し）の計画                                                      |
| LWC        | [lwc-implementation.md](./lwc-implementation.md)           | 実装の全体像（バンドル・JS / TS・HTML・CSS・js-meta.xml・検証・解析）                                |
|            | [lwc-json-types.md](./lwc-json-types.md)                   | JS / TS の JSON の型の見直し（今の型・使われ方・足りないもの・型にする案と優先度・進め方）           |
| IR         | [ir.md](./ir.md)                                           | Apex・LWC の IR の作り方（基底クラス・子の作り方・エラーを木に残さない方針と検証）                   |
| IR         | [ir-types.md](./ir-types.md)                               | IR の型の見直しの一覧（ありえない組み合わせを書ける型。修正の対象）                                  |
| IR         | [lwc-ir-types.md](./lwc-ir-types.md)                       | LWC の IR のノード型 250 の一覧（フィールド・判別 union・alias の和）と関連図                        |
| IR         | [ir-integration.md](./ir-integration.md)                   | IR を parser から JSON までの流れにつなぎ、v1 と置き換えた記録（方針・ゴールデンの違い・後始末）     |
|            | [lwc-snapshot-plan.md](./lwc-snapshot-plan.md)             | 画面のスナップショット（SSR）の試作と計画                                                            |
| メタデータ | [metadata-implementation.md](./metadata-implementation.md) | 実装の全体像（オブジェクトと、権限・Flow・画面・タブ・Visualforce・Aura などフォルダ単位の種類）     |
|            | [object-translation.md](./object-translation.md)           | オブジェクトの翻訳                                                                                   |
|            | [json-gaps.md](./json-gaps.md)                             | JSON・依存関係がまだ扱っていないもの（定義のない参照先・設定・単位がないメタデータ・参照の穴）の調査 |
| サンプル   | [examples/](./examples/README.md)                          | サンプルのリポジトリ（before / after）と、種類ごとの動作確認のスクリプト・出力                       |
