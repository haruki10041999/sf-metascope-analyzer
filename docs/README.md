# ドキュメント

| 分類       | 文書                                                       | 内容                                                                                              |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 全体       | [commons.md](./commons.md)                                 | Apex・LWC・メタデータで共通の部品（型・parser・Diff・worker）と、新しい種類を足す手順             |
|            | [metadata-roadmap.md](./metadata-roadmap.md)               | 解析木の今後の対応（未対応のメタデータ: Flow・権限・画面など、対応済みの種類の残りの解析）        |
|            | [metadata-a-plan.md](./metadata-a-plan.md)                 | 優先度 A のメタデータ（権限・ラベル・Flow・Layout・FlexiPage）の実装                              |
|            | [metadata-b-c-plan.md](./metadata-b-c-plan.md)             | 優先度 B・C のメタデータ（タブ・アプリ・値セット・Visualforce・Aura・レポートなど）の解析木の実装 |
|            | [report-components-plan.md](./report-components-plan.md)   | レポート用コンポーネントと data provider の計画                                                   |
| Apex       | [apex-implementation.md](./apex-implementation.md)         | 実装まとめ（単位・構成・Diff）                                                                    |
|            | [apex-json-reference.md](./apex-json-reference.md)         | JSON の型（JsonType / StructureJsonType / ErrorJson）                                             |
|            | [apex-json-diff-policy.md](./apex-json-diff-policy.md)     | Diff の全体の方針（分類 A〜D・status・match・型ごとの分類）                                       |
|            | [apex-declaration-diff.md](./apex-declaration-diff.md)     | 宣言（class / method / property / field）の Diff                                                  |
|            | [apex-gumtree-diff.md](./apex-gumtree-diff.md)             | 文・ブロックの Diff（GumTree）                                                                    |
|            | [apex-json-analysis.md](./apex-json-analysis.md)           | 解析（宣言・SOQL / DML・呼び出し関係など）の計画                                                  |
| LWC        | [lwc-implementation.md](./lwc-implementation.md)           | 実装まとめ（ライブラリ・単位・構成・検証・解析）                                                  |
|            | [lwc-json-reference.md](./lwc-json-reference.md)           | JSON の型（JS / TS・HTML・CSS・js-meta.xml、lightning-* のカタログ）                              |
|            | [lwc-diff-policy.md](./lwc-diff-policy.md)                 | Diff の方針                                                                                       |
|            | [lwc-library-attributes.md](./lwc-library-attributes.md)   | ライブラリ（Babel・parse5・template-compiler・postcss など）が返す parse の結果                   |
|            | [lwc-snapshot-plan.md](./lwc-snapshot-plan.md)             | 画面モック（ワイヤーフレーム・SSR）の計画                                                         |
| メタデータ | [metadata-implementation.md](./metadata-implementation.md) | オブジェクトの実装まとめ                                                                          |
|            | [metadata-json-reference.md](./metadata-json-reference.md) | オブジェクトの JSON（parse・analysis）                                                            |
|            | [metadata-diff-policy.md](./metadata-diff-policy.md)       | オブジェクトの Diff の方針                                                                        |
|            | [object-translation.md](./object-translation.md)           | オブジェクトの翻訳                                                                                |
| サンプル   | [examples/README.md](./examples/README.md)                 | 言語ごとのサンプル・生成スクリプト・生成物                                                        |
