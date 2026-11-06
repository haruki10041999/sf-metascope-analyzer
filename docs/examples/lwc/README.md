# LWC のサンプル

実装の全体は [lwc-implementation.md](../../lwc-implementation.md)。1 バンドル（フォルダ）を 1 つの単位として、JS / TS・HTML・CSS・js-meta.xml をまとめて読む。

| フォルダ                                                          | 内容                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [samples/bundles/](./samples/bundles/force-app/main/default/lwc/) | 構文をひととおり含むバンドル（`accountList`: `@api` / `@wire` / getter / `NavigationMixin` / `lwc:if` / `for:each` / `iterator` / 子コンポーネント / `:host` / カスタムプロパティ、`accountRow`: 子、`utils`: 共有モジュール、`broken`: LWC の仕様違反）                                                  |
| [samples/diff/](./samples/diff/)                                  | Diff の動作検証用の `before/` と `after/`（期待する差分は [lwc-diff-policy.md](../../lwc-diff-policy.md) 5 章）                                                                                                                                                                                           |
| [scripts/](./scripts/)                                            | `generate-json.ts`（全サンプルの JSON）、`run-diff.ts`（before → after の Diff）、`run-library-parse.ts`（ライブラリが返す木の属性の一覧）、`verify-erase-types.ts`（TS の型を空白にする処理の検証）、`ssr-snapshot/`・`ssr-lbc/`（画面モックの試作。[lwc-snapshot-plan.md](../../lwc-snapshot-plan.md)） |
| [output/json/](./output/json/index.md)                            | バンドルごとの JSON（`LwcBundleParseResult`）                                                                                                                                                                                                                                                             |
| [output/diff/](./output/diff/summary.md)                          | `summary.md`（unchanged 以外の差分）、`bundle-diff.json`                                                                                                                                                                                                                                                  |
| [output/library/](./output/library/attributes.md)                 | ライブラリ（Babel・parse5・template-compiler・postcss など）が返すノードの種類ごとの属性の一覧（説明は [lwc-library-attributes.md](../../lwc-library-attributes.md)）                                                                                                                                     |

```sh
npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts
npx ttsx --noCheck docs/examples/lwc/scripts/run-diff.ts
npx ttsx --noCheck docs/examples/lwc/scripts/run-library-parse.ts   # --raw でライブラリの木をそのまま出す (コミットしない)
npx ttsx --noCheck docs/examples/lwc/scripts/verify-erase-types.ts  # --print で空白にした JS を表示
```

期待どおりかどうかは、テスト [test/processor/lwc-diff.test.ts](../../../test/processor/lwc-diff.test.ts) と `test/converter/lwc-*.test.ts`・`test/parser/lwc-*.test.ts` で確かめる。
