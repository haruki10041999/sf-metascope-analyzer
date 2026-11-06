# サンプル

言語・メタデータの種類ごとに、サンプルコード（`samples/`）・生成スクリプト（`scripts/`）・生成物（`output/`）をまとめている。生成物はスクリプトでいつでも作り直せる（中身はサンプルとソースコードの版で決まる）。

| 種類                               | サンプル                                                                           | 生成物                                                              | 実装まとめ                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Apex](./apex/README.md)           | 構文のサンプル、Diff 用の before / after（クラス・トリガー・匿名 Apex・-meta.xml） | 単位ごとの JSON、Diff（summary・coverage）                          | [apex-implementation.md](../apex-implementation.md)         |
| [LWC](./lwc/README.md)             | バンドル、Diff 用の before / after（JS / TS・HTML・CSS・js-meta.xml）              | バンドルごとの JSON、Diff、ライブラリの属性の一覧                   | [lwc-implementation.md](../lwc-implementation.md)           |
| [メタデータ](./metadata/README.md) | オブジェクト・翻訳の before / after                                                | JSON と要約、Diff（summary・coverage・翻訳の網羅・viewer 用データ） | [metadata-implementation.md](../metadata-implementation.md) |

```sh
# すべて作り直す
npx ttsx --noCheck docs/examples/apex/scripts/generate-json.ts
npx ttsx --noCheck docs/examples/apex/scripts/run-diff.ts
npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts
npx ttsx --noCheck docs/examples/lwc/scripts/run-diff.ts
npx ttsx --noCheck docs/examples/lwc/scripts/run-library-parse.ts
npx ttsx --noCheck docs/examples/metadata/scripts/run-parse.ts
npx ttsx --noCheck docs/examples/metadata/scripts/run-diff.ts
```

- テストはサンプル（`samples/`）と Diff のスクリプト（`scripts/run-diff.ts` の `runDiff`）を使う。生成物には依存しない。
- 解析の途中の段階（IR・converter の出力）は生成物として持たない（テスト `test/apex_IR`・`test/converter`・`test/lwc_IR` で確かめる）。
