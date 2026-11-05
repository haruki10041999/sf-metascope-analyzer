# lightning-base-components の SSR の試作

`lightning-base-components`（npm）の部品を使ったコンポーネント（`modules/c/demo`）を、`@lwc/engine-server` で HTML にする。結果と注意点は [lwc-snapshot-plan.md](../../../lwc-snapshot-plan.md) 2 章。

`lightning-base-components` の採用（ライセンスの確認を含む）が決まるまで本体の依存関係に入れないので、このフォルダで依存関係を入れて実行する。

```sh
cd docs/examples/lwc/scripts/ssr-lbc
npm install
npm run snapshot   # dist/demo.html を出力する (ブラウザで開ける)
```

- ビルドは lightning-base-components の依存をすべて変換するので、20〜50 秒かかる。
- `@lwc/engine-dom` / `@lwc/synthetic-shadow` / `@lwc/wire-service` は、lightning-base-components のモジュール解決の設定が参照するので必要（実行時には使わない）。
