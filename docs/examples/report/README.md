# レポートのサンプル

レポートの文書（json-render の仕様 ＋ データの宣言）から、1 つの HTML を作るサンプル（[implementation-roadmap.md](../../implementation-roadmap.md) の R1）。

| ファイル                                                 | 内容                                                                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [specs/code-interface.json](./specs/code-interface.json) | Apex の公開メソッド・LWC の `@api`・Flow の入出力の変化のレポートの文書（`diff: true`）                                             |
| [specs/components.json](./specs/components.json)         | 部品の見本（行列・Flow の図・レイアウト・Lightning ページ・自動化・変更の影響・ソース付きの表・依存関係の図の文字列。`diff: true`） |
| [scripts/run-report.ts](./scripts/run-report.ts)         | サンプルのリポジトリ（before → after）から HTML を作る                                                                              |
| `output/<名前>.html`                                     | 作った HTML（約 1.6 MB。コミットしない）                                                                                            |

```powershell
npm run build:report                                         # viewer を 1 回だけビルドする (dist/viewer/report/index.html)
npx ttsx --noCheck docs/examples/report/scripts/run-report.ts # specs/code-interface.json から output/code-interface.html を作る
npx ttsx --noCheck docs/examples/report/scripts/run-report.ts specs/components.json
```

## 文書の形

```jsonc
{
    "title": "レポートの見出し",
    // データの宣言: 名前 → provider と引数。ビルドが実行して state.data.<名前> に入れる
    "data": { "apex": { "provider": "apex.interface", "args": { "onlyChanged": true } } },
    // json-render の仕様 (root と平らな elements)。行は { "$state": "/data/<名前>" } で指す
    "spec": {
        "root": "table",
        "elements": {
            "table": {
                "type": "DataTable",
                "props": {
                    "rows": { "$state": "/data/apex" },
                    "columns": null,
                    "caption": null,
                    "onlyChanged": true,
                },
                "children": [],
            },
        },
    },
}
```

- 部品は [src/report/catalog.ts](../../../src/report/catalog.ts)（shadcn/ui の部品の組 ＋ `DataTable`・`StatusSummary`）。
- 行（`rows`）は `$state` でしか書けない（AI が数値・一覧を書かないように）。props はカタログの zod で確かめる（[src/report/document.ts](../../../src/report/document.ts)）。

文書に `diff: true` があれば before → after を比べ、なければ after の 1 時点（すべてを出し、`status` はない）のレポートにする（MCP のツールと同じ既定）。
