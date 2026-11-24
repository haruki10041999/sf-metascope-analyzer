# LWC のサンプルの JSON

`npx ttsx --noCheck docs/examples/lwc/scripts/generate-json.ts` で生成。ノード数は kind を持つ JSON ノードの数。

| グループ | バンドル | dataType | ノード数 | resolvedError |
| --- | --- | --- | ---: | ---: |
| before | [accountList](before/accountList.json) | lwcBundle | 583 | 0 |
| before | [accountRow](before/accountRow.json) | lwcBundle | 76 | 0 |
| before | [broken](before/broken.json) | lwcBundle | 36 | 5 |
| before | [oldBanner](before/oldBanner.json) | lwcBundle | 21 | 0 |
| before | [utils](before/utils.json) | lwcBundle | 122 | 0 |
| after | [accountList](after/accountList.json) | lwcBundle | 624 | 1 |
| after | [accountRow](after/accountRow.json) | lwcBundle | 76 | 0 |
| after | [broken](after/broken.json) | lwcBundle | 36 | 5 |
| after | [newBanner](after/newBanner.json) | lwcBundle | 43 | 0 |
| after | [utils](after/utils.json) | lwcBundle | 135 | 1 |
