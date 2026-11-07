# LWC のサンプルの JSON

`npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。

| グループ | バンドル | dataType | ノード数 | resolvedError |
| --- | --- | --- | ---: | ---: |
| before | [accountList](before/accountList.json) | lwcBundle | 166 | 0 |
| before | [accountRow](before/accountRow.json) | lwcBundle | 34 | 0 |
| before | [broken](before/broken.json) | lwcBundle | 19 | 5 |
| before | [oldBanner](before/oldBanner.json) | lwcBundle | 10 | 0 |
| before | [utils](before/utils.json) | lwcBundle | 14 | 0 |
| after | [accountList](after/accountList.json) | lwcBundle | 181 | 1 |
| after | [accountRow](after/accountRow.json) | lwcBundle | 34 | 0 |
| after | [broken](after/broken.json) | lwcBundle | 19 | 5 |
| after | [newBanner](after/newBanner.json) | lwcBundle | 21 | 0 |
| after | [utils](after/utils.json) | lwcBundle | 17 | 1 |
