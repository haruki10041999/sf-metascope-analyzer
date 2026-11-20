# unknown 引数の一覧

2026-11-20 時点の作業ツリーを調査した一覧。`unknown` は入力を検証する境界でも使われるため、掲載は必ずしも修正が必要であることを意味しない。

型の属性については [unknown を含む型属性の一覧](./unknown-properties.md) を参照。

| 分類 | 一覧 | 件数（実装 / 型・宣言） |
| --- | --- | --- |
| 解析本体 | [analyzer](./unknown-parameters-analyzer.md) | 181（172 / 9） |
| ビルダー・CLI・MCP・レポート・viewer | [その他の製品コード](./unknown-parameters-app.md) | 45（45 / 0） |
| テスト・サンプル・その他 | [テスト等](./unknown-parameters-other.md) | 93（88 / 5） |
| 合計 | | 319（305 / 14） |

## 集計条件

- Git 管理対象および無視されていない未追跡の `.ts`・`.tsx` ファイルを対象とする。依存ライブラリ、ビルド出力、`.d.ts`、Git の無視対象は含めない。
- 構文解析で、引数の型に直接 `unknown` が書かれた関数・メソッド・コンストラクタ・無名コールバックと、関数型・呼び出しシグネチャ等を列挙した。実装と型宣言が別々にある場合はそれぞれ数える。
- `unknown` 自体のほか、`unknown[]`・`readonly unknown[]`・`Array<unknown>`、タプルや union / intersection の要素としての `unknown` も含む。対象引数だけを表示し、同じ関数の複数の対象引数は 1 行にまとめる。
- `Record<string, unknown>` のようにオブジェクトのプロパティや別のジェネリック型の中にある `unknown` は、引数自体が `unknown` ではないため対象外。型エイリアスの解決や文脈による型推論も対象外。
- 行番号は調査時点のもの。無名関数や関数型には `(anonymous)`・`(function type)` などを付けて区別した。
