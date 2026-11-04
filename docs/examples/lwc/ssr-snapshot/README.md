# LWC の SSR の snapshot の試作

`@lwc/engine-server` でコンポーネント（`modules/c/hello`）を HTML にする試作。方針は [lwc-snapshot-plan.md](../../../lwc-snapshot-plan.md)。

```sh
# リポジトリのルートで
npx rollup -c docs/examples/lwc/ssr-snapshot/rollup.config.mjs
node docs/examples/lwc/ssr-snapshot/dist/out.mjs
```

| ファイル                                             | 内容                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `modules/c/hello`、`modules/c/child`                 | 描画するコンポーネント（`@api`、`@wire`、`lwc:if` / `lwc:else`、`for:each`、子コンポーネント、slot、CSS） |
| `modules/lightning/card`、`modules/lightning/button` | `lightning-*` のスタブ（SLDS のクラスを付けた骨組み）                                                     |
| `mocks/apex.js`                                      | `@salesforce/apex/*` のモックの wire adapter（`globalThis.__LWC_MOCKS__` の値を返す）                     |
| `entry.js`                                           | 状態（props とモックのデータ）ごとに `renderComponent` して HTML を出力する                               |
| `rollup.config.mjs`                                  | `lwc` を `@lwc/engine-server` に向け、`@salesforce/apex/*` をモックにする                                 |

出力（`dist/`）はリポジトリに入れない。
