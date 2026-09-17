# sf-metascope-analyzer

Salesforce DXプロジェクトのオブジェクト構成を解析するMCPサーバーのたたき台です。

## MCPサーバーの起動

Node.js 22以上を使用してください。リポジトリのルートで実行します。

```powershell
nvm use
npm install
npm run mcp
```

起動時に特定の作業リポジトリも初期化したい場合は、`SF_METASCOPE_BASE_DIR` を指定します。省略した場合でも、Tool実行時に `baseDir` が初期化されます。

```powershell
$env:SF_METASCOPE_BASE_DIR = 'D:/Projects/WS/my-salesforce-app'
npm run mcp
```

MCPクライアントからは、次のToolを利用できます。

- `analyze_objects`: `baseDir` と `mode` (`snapshot` または `diff`) を指定して解析
- `render_object_report`: `baseDir` と `mode` を指定してHTMLレポートを保存

`baseDir` は次の構成を持つSalesforce DXプロジェクトのルートです。

```text
<baseDir>/force-app/main/default/objects/
```

解析結果は、このMCPサーバーリポジトリの次の場所へ保存されます。

```text
<working-repository-name>/.sf-metascope/
├─ snapshots/latest/objects/
└─ analyses/
	 ├─ objects/<ObjectApiName>.json
	 └─ report.html
```

スナップショットがない状態で `diff` を指定した場合は、初回保存として処理します。

## MCP設定例

MCPクライアントの設定では、リポジトリの絶対パスを指定してください。

```json
{
    "mcpServers": {
        "sf-metascope-analyzer": {
            "command": "npm",
            "args": ["run", "mcp"],
            "cwd": "D:/Projects/WS/sf-metascope-analyzer"
        }
    }
}
```
