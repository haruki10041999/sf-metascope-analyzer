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

### 方針書との照合（2026-11-04）

| 不整合                                                                                                                    | 修正                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `new` 式は初期化部分の `kind`（`'map'` など）を持つため JSON ノード扱いされ、`new Map{…}` / `throw new X(…)` が丸ごと比較 | `kind` と `sourceKeys` の両方を持つものだけを JSON ノードとみなし、`NewInstanceDiff` で構造比較         |
| 別のブロックから移動してきた文（`moved`）を、移動元の親の中の index で before の配列から引いていた                        | 移動元の文を `TypedDiffContext` から引いて比較                                                          |
| `break` / `continue` の `value` が fields になかった                                                                      | `value: ValueDiff<string>` を追加                                                                       |
| `when` のリテラル配列が C、`localVariable` の変数が C、`merge` の `field` が C（方針は B / D / A）                        | それぞれ B（集合）/ D（変数名）/ A（位置のスロット）に変更                                              |
| `catchCondition.exceptionType` を要素ごとに比較（方針は配列を丸ごと値）                                                   | `ValueDiff<string[]>` に変更                                                                            |
| `if` の else 節と条件付き節、`try` の catch と finally が組になりうる                                                     | 同じ種類の節だけを組にする                                                                              |
| `else` が `ValueDiff` ではなく文字列 `'else'`                                                                             | `ValueDiff<'else'>` に変更                                                                              |
| `ExpressionDiff` / `makeStatementDiff` が 1 要素の配列を返し、入力型に応じた型でなかった                                  | `ExpressionDiff<T>` / `StatementDiff<T>` を入力型から決まる型にし、差分 1 件を返す                      |
| 各 `*Json` 型に対応する `*JsonDiff`（7 章）が 1 つもなかった                                                              | 全 115 型の `*JsonDiff` を対応ファイルに追加し、`index.ts` から `commons` / `typed` / `unitBody` も公開 |
| 根のブロックで GumTree を 2 回計算していた                                                                                | 移動情報を作るときの結果を再利用                                                                        |

summary では `new Map{'a' => 1}` → `{'a' => 2}` の値、`throw new ServiceException(…)` の引数、`new Integer[3]` → `[4]` の `size` が構造差分として出るようになり、`upsert` の `field` の誤った changed が消えた。

### 出力形式の統一と sourceKey の安定化（2026-11-04）

- **kind / sourceKeys と中身の分離**: 文の並び（`BlockDiff`）・式の並び・集合の要素・値の差分も、宣言と同じく `kind` / `sourceKeys` を差分のノードの直下に置き、`value` / `before` / `after` には中身だけを入れる。配列の要素は `{ status, match, index, value: 差分 }` の入れ子をやめ、要素の差分に `match` / `index` を足した 1 段の形にした。
- **objectKey / sourceKey の分離**: `sourceKeys: { before: {objectKey, sourceKey}, after: {…} }` をやめ、`{ objectKey, sourceKey }` のそれぞれを「同じなら単体、違えば `{ before, after }`」にした。位置だけがずれたノードは `objectKey` が単体になる。
- **型名**: `*JsonDiff` の別名定義をやめ、元の Diff 型の名前を `*JsonDiff` に変えた。修飾子はアノテーション（kind `annotation`）と分けた。再エクスポートだけのファイル（`query/clauses.ts`）と、`declaration.ts` からの `statement.ts` の再エクスポートを削除した。
- **after の sourceKey だけが毎回変わる原因**: `.editorconfig` が `end_of_line = crlf` のため、エディタで保存したファイルは CRLF、ツールで書いたファイルは LF になり、改行コードで `offset` が変わって sourceKey がすべて変わっていた（after/AccountService.cls を CRLF に戻すと以前の値が再現した）。`ApexParser.parseApexClass` で LF にそろえてから解析するようにし、CRLF / LF のどちらでも同じ出力になることを確認した。このため before/AccountService.cls（CRLF）の sourceKey は今回だけ変わる。

## 検証

| コマンド                                                     | 結果                                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `npx ttsx --noCheck test/processor/diff-samples.test.ts`     | 12 / 12 passed                                                       |
| `npx ttsx --noCheck test/processor/query/query-diff.test.ts` | 8 / 8 passed                                                         |
| `npx ttsx --noCheck test/processor/gumtree-diff.test.ts`     | 26 / 26 passed                                                       |
| `npx ttsc --noEmit --pretty false`                           | diff 変更箇所に型エラーなし。parser / worker に既存の 3 エラーが残る |

残る型エラーは `src/analyzer/parser/Apex/index.ts` の `./extractor` 不在、`src/analyzer/parser/Apex/parser.ts` の `StructureJson` export 不在、`src/analyzer/worker/apexTask.ts` の `ErrorFileStructureType` の型不一致。
