# LWC のサンプルの JSON

`npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。

| グループ    | バンドル                                    | dataType  | ノード数 | resolvedError |
| ----------- | ------------------------------------------- | --------- | -------: | ------------: |
| bundles     | [accountList](bundles/accountList.json)     | lwcBundle |      166 |             0 |
| bundles     | [accountRow](bundles/accountRow.json)       | lwcBundle |       34 |             0 |
| bundles     | [broken](bundles/broken.json)               | lwcBundle |       19 |             5 |
| bundles     | [utils](bundles/utils.json)                 | lwcBundle |       14 |             0 |
| diff-before | [accountList](diff-before/accountList.json) | lwcBundle |      166 |             0 |
| diff-before | [accountRow](diff-before/accountRow.json)   | lwcBundle |       34 |             0 |
| diff-before | [broken](diff-before/broken.json)           | lwcBundle |       19 |             5 |
| diff-before | [oldBanner](diff-before/oldBanner.json)     | lwcBundle |       10 |             0 |
| diff-before | [utils](diff-before/utils.json)             | lwcBundle |       14 |             0 |
| diff-after  | [accountList](diff-after/accountList.json)  | lwcBundle |      181 |             1 |
| diff-after  | [accountRow](diff-after/accountRow.json)    | lwcBundle |       34 |             0 |
| diff-after  | [broken](diff-after/broken.json)            | lwcBundle |       19 |             5 |
| diff-after  | [newBanner](diff-after/newBanner.json)      | lwcBundle |       21 |             0 |
| diff-after  | [utils](diff-after/utils.json)              | lwcBundle |       17 |             1 |
