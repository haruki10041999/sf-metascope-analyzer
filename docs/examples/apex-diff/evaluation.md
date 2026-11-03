# Apex Diff 実装評価

`run-diff.ts` で `before/` と `after/` のサンプルを解析し、生成された差分を [summary](./diff-output/summary.md) と [coverage](./diff-output/coverage.md) で確認した。再実行コマンド:

```sh
npx ttsx --noCheck docs/examples/apex-diff/run-diff.ts
```

## 評価結果

| 観点                                              | 結果                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| ファイル単位の追加・削除・変更・不変              | 9 ファイルすべて期待どおり                                                                                          |
| `JsonType` / `StructureJsonType` の kind coverage | `ALL_KINDS` の全 kind が差分ノードに出現                                                                            |
| 文の対応付け・移動                                | GumTree による文配列の対応付けを維持。finally から catch への移動を `moved` として検出                              |
| 式・文の差分                                      | trigger の条件式を含め、型付きの構造差分を生成                                                                      |
| SOQL / SOSL                                       | SELECT の並び替えは差分なし。SELECT 項目の置換は `removed` + `added`。副問い合わせの WHERE 条件など句の変更を構造化 |
| JSON 文字列比較                                   | diff 実装内に `JSON.stringify` による比較はなし                                                                     |

## 確認した不整合と修正

- 汎用 `TypedJsonDiff` が文以外の配列にも GumTree を適用していたため、汎用配列は値差分にし、GumTree で対応付ける文配列には要素ごとの専用差分 builder を渡す形にした。
- trigger / anonymous の本文は `MemberStatementJson` wrapper を使う。GumTree には内側の statement を渡し、wrapper の modifier も専用 modifier 差分で保持するようにした。
- 副問い合わせの集合内対応付けは `FROM` を基準にし、内容変更を `subQuery` の構造差分として表示する。SELECT 項目のテスト期待値は集合の方針に合わせ、置換を `removed` + `added` として検証する。
- summary では副問い合わせの WHERE 追加が `subQuery (changed)` 以下に、trigger の条件式変更が型付き差分として出力されることを確認した。

## 検証

| コマンド                                                     | 結果                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `npx ttsx --noCheck test/processor/diff-samples.test.ts`     | 12 / 12 passed                                                       |
| `npx ttsx --noCheck test/processor/query/query-diff.test.ts` | 8 / 8 passed                                                         |
| `npx ttsx --noCheck test/processor/gumtree-diff.test.ts`     | 21 / 21 passed                                                       |
| `npx ttsc --noEmit --pretty false`                           | diff 変更箇所に型エラーなし。parser / worker に既存の 3 エラーが残る |

残る型エラーは `src/analyzer/parser/Apex/index.ts` の `./extractor` 不在、`src/analyzer/parser/Apex/parser.ts` の `StructureJson` export 不在、`src/analyzer/worker/apexTask.ts` の `ErrorFileStructureType` の型不一致。
