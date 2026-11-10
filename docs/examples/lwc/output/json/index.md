# LWC のサンプルの JSON

`npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。

| グループ | バンドル | dataType | ノード数 | resolvedError |
| --- | --- | --- | ---: | ---: |
| before | [accountList](before/accountList.json) | lwcBundle | 423 | 0 |
| before | [accountRow](before/accountRow.json) | lwcBundle | 52 | 0 |
| before | [broken](before/broken.json) | lwcBundle | 22 | 5 |
| before | [oldBanner](before/oldBanner.json) | lwcBundle | 13 | 0 |
| before | [utils](before/utils.json) | lwcBundle | 86 | 0 |
| after | [accountList](after/accountList.json) | lwcBundle | 452 | 1 |
| after | [accountRow](after/accountRow.json) | lwcBundle | 52 | 0 |
| after | [broken](after/broken.json) | lwcBundle | 22 | 5 |
| after | [newBanner](after/newBanner.json) | lwcBundle | 28 | 0 |
| after | [utils](after/utils.json) | lwcBundle | 93 | 1 |
