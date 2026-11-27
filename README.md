# sf-metascope-analyzer

Salesforce DX プロジェクト（Apex・LWC・オブジェクト・権限・Flow など）を解析し、ドキュメントの作成とコードの理解を助ける MCP サーバーです。解析結果・依存関係を返し、利用者が自由に組めるレポート（1 つの HTML）を作ります。差分（前回保存した時点・git の範囲）と影響の調査は、その補助です。計画とやることは [docs/plan.md](docs/plan.md) にまとめています。

## MCP サーバーの起動

Node.js 24.15 以上を使ってください（保存に `node:sqlite` を使います）。

```powershell
npm install
npm run build:node   # ビルド版 (起動が速い)
npm run mcp:node     # ビルド版で起動する。ソースのまま起動するなら npm run mcp
```

設定は環境変数で行います。

| 環境変数                  | 内容                                         | 既定                                                                          |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `SF_METASCOPE_REPOSITORY` | 解析する Salesforce DX プロジェクト          | 起動したフォルダ                                                              |
| `SF_METASCOPE_BASE_DIR`   | 保存先（前回の解析の結果など）               | `<リポジトリ>/.sf-metascope`（`.gitignore` に足してください）                 |
| `SF_METASCOPE_THREADS`    | parse に使うスレッドの数（0 で並列にしない） | ビルド版（`npm run mcp:node`）では最大 8、ソースのまま（`npm run mcp`）では 0 |

- 接続のあと、リポジトリの読み込みを裏で始めます。最初のツールの呼び出しは、読み込みが終わるまで待ちます。
- 保存した結果がなければ、起動したときの状態を比べる基準（before）として保存します。
- 保存先は SQLite の 1 ファイル（`<保存先>/store/metascope.db`）です。変わっていない単位は、保存した解析結果を読んで使います。

## コマンドライン（AI を使わずにレポートを作る）

MCP のサーバーと同じ設定（上の環境変数）で、リポジトリのレポートを作れます。先に `npm run build` が要ります（ソースのまま動かすなら `npm run cli -- <引数>`）。

```powershell
npx sf-metascope report templates                               # 雛形の一覧
npx sf-metascope report new apex_specification --out apex.json  # 雛形の文書を書く
npx sf-metascope report validate apex.json --repo <リポジトリ>   # 文書を確かめる
npx sf-metascope report build apex.json --repo <リポジトリ> --out reports
npx sf-metascope report data apex.outline --repo <リポジトリ>    # provider のデータを見る (列を決めるため)
npx sf-metascope report notes apex.json --repo <リポジトリ> --missing   # notes に書くべきキー (未記入だけ)
npx sf-metascope report export apex.json --repo <リポジトリ> --out csv   # データをデータの名前ごとの CSV に書き出す
```

- `--diff`（保存した基準と比べる）・`--compare main` / `--compare main...HEAD`（git の範囲）・`--param <名前>=<値>`（文書の引数）も使えます。
- 1 件 1 ページの文書（Apex の仕様書など）は、`<名前>/index.html`（目次）と `pages/` に書きます。
- 終了コードは、成功 0・文書の問題や失敗 1・使い方の誤り 2 です。
- `report new --out` で書いた文書には `$schema`（[docs/catalog/report-document.schema.json](docs/catalog/report-document.schema.json)）が付き、VS Code で部品・provider の名前・props・引数が補完されます。雛形の JSON は [docs/catalog/templates/](docs/catalog/templates/) にもあります。

## ツール・リソース・プロンプト

| ツール                                                                                                | 内容                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `list_report_components` / `describe_report_component`                                                | レポートの書き方の決まりと部品・provider の一覧 / 部品の props                                         |
| `list_report_providers` / `describe_report_provider` / `get_report_data`                              | レポートのデータの provider の一覧 / 引数と出力のスキーマ / データ（各行の `status` が前回からの差分） |
| `validate_report_spec` / `build_report`                                                               | レポートの文書（`{ title, data, spec }`）の検証 / 1 つの HTML の作成（`<保存先>/reports/`）            |
| `list_note_keys`                                                                                      | 文書の notes のキーの一覧（for の行で決まるキーも展開して数える。書いてあるか・使っていないキー）      |
| `save_baseline`                                                                                       | 今の状態を、次に比べる基準として保存する                                                               |
| `get_dependents` / `get_dependencies` / `get_change_impact` / `get_missing_references` / `list_units` | 依存関係（使っているもの・変更の影響・ない参照先）                                                     |
| `list_node_kinds` / `find_nodes`                                                                      | 解析結果のノード（メソッド・SOQL・フローの要素など）の種類と数 / 種類などで探し、ファイルと行を返す    |

- リソース: `metascope://catalog`（カタログの概要）・`metascope://catalog/full`・`metascope://catalog/components/{name}`・`metascope://catalog/providers/{name}`・`metascope://schema/report-document`
- プロンプト（雛形。出発点で、形は自由に変えてよい）: `system_overview`（システムの構成）・`object_definition`（オブジェクト定義書）・`apex_specification`（Apex の仕様書）・`lwc_overview`（LWC のコンポーネント一覧）・`translation_overview`（翻訳の状況）・`metadata_inventory`（メタデータの棚卸し）・`automation_overview`（自動化）・`security_overview`（セキュリティと共有）・`ui_overview`（画面）・`integration_overview`（連携）・`analytics_overview`（分析）・`feature_overview`（機能のまとまり。起点から依存関係をたどった範囲）・`permission_overview`（権限の一覧）・`impact_analysis`（変更の影響の調査）・`release_review`（リリース前のレビュー。差分）
- 既定は今の作業ツリーのすべて（1 時点。行に `status` はない）。差分を見るときだけ、ツールか文書に `diff: true`（保存した基準（`save_baseline`）→ 作業ツリー）か `compare`（`{ "from": "main" }` は main...作業ツリー、`{ "from": "main", "to": "HEAD" }` は main...HEAD）を書く。差分だけを返す provider（`permission.diffs`・`flow.diffs`・`dependency.impact`・`dependency.changes`）は、どちらかが要る
- レポートの HTML を作るには、先に viewer をビルドしておく（`npm run build:report`。`npm run build` にも含まれる）。カタログは [docs/catalog/](docs/catalog/report-catalog.md)

機密になりうる値（指定ログイン情報の URL など）は伏せて返します。

## MCP の設定の例

```json
{
    "mcpServers": {
        "sf-metascope-analyzer": {
            "command": "node",
            "args": ["D:/Projects/WS/sf-metascope-analyzer/dist/node/mcp/server.js"],
            "env": { "SF_METASCOPE_REPOSITORY": "D:/Projects/WS/my-salesforce-app" }
        }
    }
}
```
