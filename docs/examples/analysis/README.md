# 依存関係の基準と計測

JSON の改修（[json-redesign-plan.md](../../json-redesign-plan.md)）と保存の見直し（[save-format-plan.md](../../save-format-plan.md)）で、段階ごとに確かめるためのスクリプト。サンプルは [../repository/](../README.md) の before / after。

| ファイル                                     | 内容                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [scripts/baseline.ts](./scripts/baseline.ts) | 依存関係の基準（段階 M0）。グラフの辺（メンバーの細かさ → 参照先）と、ない参照の指摘を `output/baseline-<side>.json` に書く                                                       |
| [scripts/measure.ts](./scripts/measure.ts)   | parse・保存・読み込み・定義と参照・グラフ・差分の時間と、保存データの大きさ（段階 S0。save-format-plan 1.7 の表）。引数で before / after のリポジトリを渡せば、ほかのものも測れる |
| [output/](./output/)                         | 基準（`baseline-before.json`・`baseline-after.json`）                                                                                                                             |

```sh
npx ttsx --noCheck docs/examples/analysis/scripts/baseline.ts
npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts [<before> <after>]
```

- 基準は [test/dependency/baseline.test.ts](../../../test/dependency/baseline.test.ts) で確かめる。今のグラフに、基準の行がすべて残っていれば通る（行が増えるのはよい）。
- 行が減るのが正しいとき（同じ参照の 2 本の辺を 1 本にした、など）は、減った行と理由を確かめてから `baseline.ts` で作り直す。
