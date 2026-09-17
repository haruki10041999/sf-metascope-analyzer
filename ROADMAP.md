# sf-metascope-analyzer Roadmap

## 1. 目的

Salesforce DXプロジェクトのメタデータを解析し、2つの時点の差分、オブジェクト間の依存関係、変更内容のドキュメントをMCPサーバー経由で提供する。

最初の実装対象は、現在実装されているオブジェクトとフィールドに限定する。Apex、LWC、カスタムラベル、権限セットは、共通モデルと拡張可能な構成を準備したうえで後続フェーズに追加する。

## 2. 第1フェーズの対象範囲

### 対象

- Salesforceオブジェクト
- 標準フィールド
- カスタムフィールド
- Lookupフィールド
- Master-Detailフィールド
- オブジェクトの追加・削除
- フィールドの追加・削除
- 参照先オブジェクトが削除された場合の影響
- オブジェクト間の依存関係
- HTMLレポート
- MCPのstdio接続

### 対象外

- Apex Class、Apex Triggerの解析
- LWCの解析
- カスタムラベルの解析
- 権限セットの解析
- Salesforce Orgへの接続
- Metadata APIによる取得
- ブラウザ上での編集
- PNG/SVGのサーバー側生成

## 3. 入力と保存先の仕様

MCPツールには、ユーザーが作業対象として開いているリポジトリのルートディレクトリを `baseDir` として渡す。比較元と比較先のディレクトリを個別に指定する方式は採用しない。

```text
<baseDir>/force-app/main/default/objects/
├─ Account/
│  └─ fields/
├─ Contact/
│  └─ fields/
└─ CustomObject__c/
   └─ fields/
```

MCPツールの入力:

```typescript
type AnalyzeObjectsInput = {
    baseDir: string;
    mode: 'snapshot' | 'diff';
};
```

- `baseDir`: ユーザーが開いている作業リポジトリのルート
- `mode`: 現在状態を保存する `snapshot`、または前回保存状態と比較する `diff`
- `baseDir` 配下の `force-app/main/default/objects` を解析対象とする
- `baseDir` がSalesforce DXプロジェクトのルートでない場合はエラーを返す
- 比較元は、MCPサーバー側に保存された前回スナップショットを使用する
- `afterDir` のような比較先ディレクトリは入力に持たず、常に `baseDir` の現在状態を読み込む
- `baseDir` に対応するスナップショットがない場合は、`diff` を指定しても初回保存として扱う
- 初回保存では現在のオブジェクト構成をスナップショットとしてコピーし、差分は生成しない

### 保存先

解析結果は、MCPサーバーを配置しているこのリポジトリの直下に、作業リポジトリのディレクトリ名を使って保存する。

```text
<sf-metascope-analyzer>/
└─ <working-repository-name>/
    └─ .sf-metascope/
        ├─ snapshots/
        │  └─ latest/
        │     └─ objects/
        └─ analyses/
            ├─ objects/
            │  ├─ Account.json
            │  └─ Contact.json
            └─ report.html
```

例:

```text
baseDir = D:/Projects/WS/my-salesforce-app

D:/Projects/WS/sf-metascope-analyzer/
└─ my-salesforce-app/
    └─ .sf-metascope/
        ├─ snapshots/latest/objects/
        └─ analyses/objects/
```

- `<working-repository-name>` は `baseDir` の最後のディレクトリ名から生成する
- 出力先はMCPサーバー側リポジトリの管理領域に固定する
- ユーザーが任意の出力パスを指定する方式は第1フェーズでは採用しない
- 同名リポジトリを扱う場合は、将来的に絶対パス由来の識別子を追加する

## 4. 差分仕様

### ステータス

```typescript
type Status = 'New' | 'Exist' | 'Delete';
```

第1フェーズでは、既存フィールドの型変更や参照先変更は、専用の `Update` ではなく現行モデルの制約に従う。将来的には変更内容を明確に表現するため、`Update` または変更前後の値を追加する。

### オブジェクト差分

- 現在状態にだけ存在するオブジェクト: `New`
- 前回スナップショットにだけ存在するオブジェクト: `Delete`
- 両方に存在するオブジェクト: `Exist`

### フィールド差分

- 現在状態にだけ存在するフィールド: `New`
- 前回スナップショットにだけ存在するフィールド: `Delete`
- 両方に存在するフィールド: `Exist`
- 参照先オブジェクトが削除されたフィールド: `Delete`

## 5. 依存関係仕様

依存関係の方向は、参照フィールドを持つオブジェクトから参照先オブジェクトとする。

```text
Contact --AccountId--> Account
```

```typescript
type Dependency = {
    parentObjectApiName: string;
    parentFieldApiName: string;
    childObjectApiName: string;
};
```

`getDependencyDiff(targetObjectApiName, depth)` は、対象オブジェクトから子方向へ最大 `depth` 階層を探索する。

- `depth = 1`: 直接参照のみ
- `depth = 2`: 直接参照と2階層目
- `depth <= 0`: 空配列
- 小数、`NaN`、無限大: 空配列
- 同一の親オブジェクト、親フィールド、子オブジェクトの組み合わせは重複させない

## 6. MCPサーバー仕様

### 接続方式

第1フェーズは `stdio` transport を使用する。MCPクライアントがローカルプロセスとして起動できる構成にする。

### MCP Tools

#### `analyze_objects`

指定された作業リポジトリのオブジェクトディレクトリを読み込み、保存または差分解析を行う。MCP Promptから呼び出す場合は、利用者が保存か差分かを選択する。

```typescript
type AnalyzeObjectsInput = {
    baseDir: string;
    mode: 'snapshot' | 'diff';
};
```

処理ルール:

1. `baseDir` の `force-app/main/default/objects` を読み込む
2. 対応する `snapshots/latest/objects` がない場合、`mode` に関係なく初回保存する
3. `mode = snapshot` の場合、現在状態を新しいスナップショットとして保存する
4. `mode = diff` の場合、前回スナップショットと現在状態を比較する
5. 差分解析後、現在状態を次回比較用の最新スナップショットとして保存する
6. オブジェクトごとの解析結果を `analyses/objects/<apiName>.json` へ保存または更新する
7. 削除されたオブジェクトの古い結果ファイルを削除する
8. `snapshot`／`diff` モードのレポートを同じ保存先へ保存または更新する

依存関係とサマリーは独立したJSONファイルやMCP Toolの返却対象として保存しない。依存関係はレポート生成時に必要な範囲で計算し、サマリーはレポート画面内の補助情報として表示する。

返却値:

```typescript
type AnalysisResult = {
    baseDir: string;
    mode: 'snapshot' | 'diff';
    updatedAt: string;
    objectCount: number;
};
```

#### `get_object_diff`

```typescript
type GetObjectDiffInput = {
    baseDir: string;
    objectApiName?: string;
    status?: Status;
};
```

対象オブジェクトやステータスで差分を絞り込む。

#### `render_object_report`

```typescript
type RenderObjectReportInput = {
    baseDir: string;
    mode: 'snapshot' | 'diff';
};
```

解析対象リポジトリ名に対応する保存先へHTMLレポートを保存する。`mode` により表示内容を切り替える。

- `snapshot`: 現在のオブジェクト構成を表示する
- `diff`: 保存済みの前回状態と現在状態の違いを表示する

レポートには次を含める。

- 解析情報
- オブジェクト／フィールド差分
- New/Exist/Deleteの表示
- 必要な場合の参照関係グラフ
- オブジェクト数や変更件数などの簡易サマリー

Markdownドキュメントの独立生成は第1フェーズの対象外とし、HTMLレポートを正式な出力とする。

### MCP Resources

必要になった段階で、解析結果をResourceとして公開する。

```text
metadata://repository/{repositoryName}/objects
metadata://repository/{repositoryName}/report
```

第1実装ではToolsを優先し、Resourceは解析結果保存の仕様が固まった後に追加する。

### MCP Prompts

利用者がMCPクライアントから処理方法を選択できるよう、次のPromptを用意する。

#### `analyze_object_repository`

引数:

```typescript
type AnalyzeObjectRepositoryPromptInput = {
    baseDir: string;
    mode: 'snapshot' | 'diff';
};
```

表示内容の例:

- 「現在のオブジェクト構成を保存しますか？」: `snapshot`
- 「前回保存状態との差分を解析しますか？」: `diff`

ただし、対応する最新スナップショットが存在しない場合は、`diff` を選択しても初回保存へフォールバックする。この場合、差分が存在しないことと、次回から差分解析が可能になることを結果に明示する。

### LLMを使ったレポート対象の選択

利用者がMCPクライアントで次のように依頼できるようにする。

```text
注文に関係するオブジェクトだけ、変更点を説明するレポートを作って
```

LLM連携の処理フロー:

1. チャット入力から対象条件、レポートモード、説明の観点を抽出する
2. 解析済みオブジェクトのAPI名、フィールド名、参照関係を候補として検索する
3. 対象候補と選定理由をユーザーへ提示する
4. ユーザーの確認後、対象オブジェクトを限定してHTMLレポートを生成する
5. レポートに対象条件、選定されたオブジェクト、LLMの説明を表示する

```typescript
type ReportTargetRequest = {
    baseDir: string;
    mode: 'snapshot' | 'diff';
    request: string;
    confirmedObjectApiNames?: string[];
};
```

LLMはファイルを直接変更せず、解析済みデータから対象候補と説明文だけを生成する。対象が曖昧な場合や候補が複数ある場合は自動確定せず、ユーザー確認を要求する。

## 7. 解析結果の保存

解析結果と比較用スナップショットは、MCPサーバー側リポジトリに作成した作業リポジトリ名のディレクトリ内へ保存する。解析結果は履歴を持たず、同じ作業リポジトリに対する再解析で既存ファイルを更新する。

```text
<sf-metascope-analyzer>/<working-repository-name>/.sf-metascope/
├─ snapshots/
│  └─ latest/
│     └─ objects/
└─ analyses/
    ├─ objects/
    │  ├─ Account.json
    │  └─ Contact.json
    ├─ report.html

```

生成物をリポジトリで管理する場合は、次を推奨する。

- 作業リポジトリ名のディレクトリはGit管理する
- オブジェクトごとの解析JSONはGit管理する
- `report.html` はGit管理する
- 再解析時は同名オブジェクトのJSONを更新する
- 削除されたオブジェクトの結果ファイルは削除する

## 8. ファイル構成

### 第1フェーズ完成形

```text
src/
├─ index.ts
├─ mcp/
│  ├─ server.ts
│  ├─ types.ts
│  ├─ prompts/
│  │  └─ analyzeObjectRepository.ts
│  ├─ tools/
│  │  ├─ analyzeObjects.ts
│  │  ├─ getObjectDiff.ts
│  │  ├─ renderObjectReport.ts
│  │  └─ selectReportTargets.ts
│  └─ storage/
│     ├─ analysisStore.ts
│     └─ snapshotStore.ts
├─ parser/
│  └─ metadata.ts
├─ processor/
│  ├─ metadata.ts
│  └─ metadataDependency.ts
├─ renderer/
│  └─ metadata.ts
├─ llm/
│  ├─ explainObjectChanges.ts
│  └─ selectReportTargets.ts
└─ types/
   ├─ commons.ts
   ├─ metadata.ts
   ├─ metadataDependency.ts
   └─ analysis.ts
```

### 責務

- `parser`: Salesforceファイルをアプリケーションの型へ変換
- `processor`: 差分と依存関係を計算
- `renderer`: snapshot／diffのHTMLレポートへ変換
- `mcp/tools`: MCP入力を検証し、既存処理を呼び出す
- `mcp/storage`: 解析結果の保存と読み込み
- `llm`: 変更内容の説明とレポート対象候補の抽出
- `mcp/server`: MCPサーバーの起動とTool登録
- `types`: 層をまたいで利用するデータモデル

## 9. パスとセキュリティ方針

MCPから作業リポジトリを読み込み、MCPサーバー側リポジトリへ書き込むため、パス制御を必須とする。

- `baseDir` は起動時に許可した作業リポジトリのルート配下に限定する
- `baseDir` は絶対パスへ正規化する
- 保存先はMCPサーバー側リポジトリのルート配下に限定する
- 保存先ディレクトリ名はパス区切りなどを除去した安全なリポジトリ名にする
- `..` によるパス脱出を拒否する
- 保存先の親ディレクトリを自動作成する
- 同じ作業リポジトリの解析結果は履歴を保持せず、同名ファイルを更新する
- シンボリックリンク経由の脱出も検討する
- エラーはMCPの構造化エラーとして返す

## 10. 実装タスクリスト

### 基盤

- [ ] MCP SDKを導入する
- [ ] `stdio` サーバーを起動できるようにする
- [ ] `package.json` にMCP起動スクリプトを追加する
- [ ] MCPクライアント用の設定例をREADMEに追加する
- [ ] 入力スキーマをZodで定義する
- [ ] `snapshot`／`diff` を選択するMCP Promptを実装する

### 解析結果モデル

- [ ] `AnalysisResult` 型を追加する
- [ ] `baseDir`、比較対象スナップショット、実行日時、レポートモードを結果に記録する
- [ ] 現在の差分型と依存関係型の重複を整理する

### 保存

- [ ] `.sf-metascope/analyses/objects` の作成処理を追加する
- [ ] `.sf-metascope/snapshots/latest/objects` の保存・読み込み処理を追加する
- [ ] 初回保存時に `baseDir` のオブジェクト構成をスナップショットへコピーする
- [ ] 差分解析後に現在状態を次回比較用スナップショットとして更新する
- [ ] オブジェクトごとに `<apiName>.json` を保存または更新する
- [ ] 削除されたオブジェクトの解析結果ファイルを削除する
- [ ] JSON保存・読み込み処理を追加する
- [ ] `baseDir` とMCPサーバー側保存先のパス検証を追加する
- [ ] 作業リポジトリ名による保存先解決処理を追加する

### MCP Tools

- [ ] `analyze_objects` を実装する
- [ ] `diff` 指定時にスナップショットがない場合の初回保存フォールバックを実装する
- [ ] `get_object_diff` を実装する
- [ ] `render_object_report` を実装する
- [ ] `select_report_targets` を実装する

### レンダリング

- [ ] 現在のHTMLレンダラーを解析結果モデルに接続する
- [ ] `snapshot`／`diff` モードをHTMLに追加する
- [ ] 現在状態のスナップショット表示を実装する
- [ ] 前回状態との差分表示を実装する
- [ ] 依存関係を必要な範囲だけレポート内に描画する
- [ ] オブジェクト数や変更件数の簡易説明をレポート内に表示する
- [ ] MermaidのノードIDを安全なIDへ変換する
- [ ] オフライン閲覧の要否を決める
- [ ] HTMLレポート出力のテストを追加する

### LLM連携

- [ ] 変更内容を自然言語で説明するLLM処理を追加する
- [ ] チャット入力から対象オブジェクト名や条件を抽出する
- [ ] LLMが抽出した対象候補をユーザーが確認・修正できるPromptを追加する
- [ ] 対象オブジェクトを限定したレポートを生成する
- [ ] LLMの判断結果と根拠をレポートに表示する
- [ ] LLMが不確実な場合は勝手に対象を確定せず、確認を要求する

### 品質

- [ ] 初回保存で差分を生成しないテスト
- [ ] `snapshot` 選択で現在状態を保存するテスト
- [ ] `diff` 選択で前回スナップショットと比較するテスト
- [ ] スナップショット未存在時に初回保存へフォールバックするテスト
- [ ] `snapshot` レポートが現在状態を表示するテスト
- [ ] `diff` レポートが既存と変更の違いを表示するテスト
- [ ] 同名ファイルが再解析で更新されるテスト
- [ ] オブジェクト追加・削除のテスト
- [ ] フィールド追加・削除のテスト
- [ ] Lookup／Master-Detailのテスト
- [ ] 複数フィールドによる同一オブジェクト参照のテスト
- [ ] 循環依存のテスト
- [ ] `depth` の境界値テスト
- [ ] 不正パス拒否のテスト
- [ ] MCP Toolの入力エラーテスト
- [ ] LLMが対象候補を正しく抽出するテスト
- [ ] 対象候補の確認が必要なケースのテスト
- [ ] MCPクライアントからの手動疎通確認

## 11. 完了条件

第1フェーズは、次を満たした時点で完了とする。

- MCPクライアントからサーバーをstdioで起動できる
- `baseDir` のオブジェクト構成をスナップショットとして保存できる
- 前回スナップショットと現在の `baseDir` を比較できる
- `snapshot`／`diff` をMCP Promptから選択できる
- スナップショットがない場合、`diff` が初回保存へフォールバックする
- 解析結果がオブジェクトごとのJSONファイルに保存される
- 同じ作業リポジトリを再解析すると既存ファイルが更新され、履歴ファイルが増えない
- 削除されたオブジェクトの古い結果ファイルが残らない
- オブジェクトごとの解析結果をMCP Toolで取得できる
- HTMLレポートを作業リポジトリ名の保存先へ保存できる
- `snapshot` レポートで現在のオブジェクト状態を確認できる
- `diff` レポートで既存状態と変更内容を確認できる
- LLMに対象条件を自然言語で指定し、候補オブジェクトを抽出できる
- リポジトリ外への読み書きが拒否される
- 主要な差分・依存関係・パス制御のテストが通る

## 12. 将来の拡張

第1フェーズの共通モデルとMCP Toolの命名を維持し、メタデータ種別を追加する。

1. Apex Class / Apex Trigger
2. LWC
3. Custom Labels
4. Permission Sets
5. 横断依存関係グラフ
6. MCP Resources
7. 定型レビュー用MCP Prompts
8. Salesforce OrgやMetadata APIからの取得

将来は、メタデータ種別ごとのParser／Processorを追加し、共通の差分・依存関係・出力モデルへ変換する構成を目指す。
