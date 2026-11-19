# 5. CLI と MCP（`src/cli`・`src/mcp`）の実装詳細

[実装タスク別の変更先と実装方針](../implementation-task-paths.md) ・ [元の実装タスク一覧](../implementation-tasks.md)

「現行コード」は調査時点の実装に基づきます。「コード修正案」とコードブロックは変更後の案です。省略したヘルパーと型は、記載のファイルに組み込むときに実装または既存処理へ接続します。確認ケースは実装後に検証する内容です。

各項目の「関数・型の変更一覧」では、定義名ごとに変更後のシグネチャまたは型の関係する属性と、その定義の実装方針を示します。追加候補の名前は計画上の名前です。

<a id="implementation-detail-155"></a>

## 155. `report watch`

**解決したい問題** 文書や関連notesを保存するたびに、手で report build を繰り返す作業を減らしたい。

**現行コード** runCli の build は一度だけ入力を解決し writeReportSite を呼ぶ。監視による再実行や二重ビルドの制御がない。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/inputs.ts`](../../src/builder/inputs.ts)

**新規パス候補** `src/cli/reportWatch.ts`

**コード修正案** build一回分を共通関数へ切り出す。監視側は変更を短時間でまとめ、1回ずつ呼ぶ。途中失敗を表示し、次の保存を引き続き受け付ける。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` の build 分岐から一回分の生成を共用できるようにする。
- watch の変更検知、終了処理、個別失敗時の継続を CLI 出力に接続する。

#### 既存型の直接変更なし

**方針**

- `CliIo` は現在の出力・実行境界を利用する。監視器をテストから差し替える必要があれば内部オプションで渡す。

#### 新規関数 `watchReport`

**引数・戻り値**

```text
watchReport(input: ReportWatchOptions, buildOnce: () => Promise<void>, signal?: AbortSignal): Promise<void>
```

**方針**

- `watchReport(input, buildOnce, signal)` が監視を開始し、`rebuildPending()` が連続変更をまとめて順番に処理する。

#### 新規関数 `rebuildPending`

**引数・戻り値**

```text
rebuildPending(): Promise<void>
```

**方針**

- `watchReport(input, buildOnce, signal)` が監視を開始し、`rebuildPending()` が連続変更をまとめて順番に処理する。

#### 新規型 `ReportWatchOptions`

**属性・型**

```text
ReportWatchOptions { paths: readonly string[]; debounceMs?: number }
```

**方針**

- `ReportWatchOptions` は監視対象、デバウンス間隔、停止シグナルを持つ案。
- 公開の文書型は不要。

**処理・互換性の補足** 既存の生成処理を一回分の関数として呼び、文書・参照notes・必要な入力を監視する。連続イベントをまとめ、実行中に保存された場合は次回分を待ち行列に一件残す。監視終了時にリスナーを閉じる。

**変更コード案**

```ts
// src/cli/reportWatch.ts
let pending = false;
let running = false;
async function rebuildPending(): Promise<void> {
    if (running) return;
    running = true;
    try {
        while (pending) {
            pending = false;
            await buildOnce().catch(reportBuildFailure);
        }
    } finally {
        running = false;
    }
}
// 監視イベント側で pending を立て、デバウンス後に rebuildPending を呼ぶ。
```

**確認ケース** 連続保存、ビルド中の保存、壊れた文書を修正して再保存、終了時のリソース解放を確認する。

<a id="implementation-detail-156"></a>

## 156. `report export`

**解決したい問題** 出来上がった仕様書をレビュー用のWordや、表を編集できるExcelでも渡したい。

**現行コード** CLI は解決済みレポートをHTMLへ書く。章・本文・表を複数形式へ渡す中間モデルがない。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`package.json`](../../package.json)

**新規パス候補** `src/builder/export/excel.ts`、`src/builder/export/markdown.ts`、`src/builder/export/word.ts`、`src/report/export/table.ts`

**コード修正案** resolveReport の spec/state から描画順で中間ブロックを作り、形式別の出力関数へ渡す。表データの正規化は viewer の表限定出力と共用する。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` で report export を受け付け、`resolveReport` の成功結果を指定形式へ渡す。
- HTMLの `writeReportSite` とは別の出力経路にする。

#### 既存型の直接変更なし

**方針**

- `ResolvedReport` の成功結果を入力に使い、既存の解析スキーマは維持する。

#### 新規関数 `blocksOfReport`

**引数・戻り値**

```text
blocksOfReport(report: EmbeddedReport, pages: readonly EmbeddedReport[]): ExportBlock[]
```

**方針**

- `blocksOfReport(report, pages)` が描画順の中間表現を作る。

#### 新規関数 `exportExcel`

**引数・戻り値**

```text
exportExcel(blocks: readonly ExportBlock[]): Promise<Uint8Array>
```

**方針**

- `exportExcel`、`exportMarkdown`、`exportWord` が各形式へ変換する。

#### 新規関数 `exportMarkdown`

**引数・戻り値**

```text
exportMarkdown(blocks: readonly ExportBlock[]): Promise<string>
```

**方針**

- `exportExcel`、`exportMarkdown`、`exportWord` が各形式へ変換する。

#### 新規関数 `exportWord`

**引数・戻り値**

```text
exportWord(blocks: readonly ExportBlock[]): Promise<Uint8Array>
```

**方針**

- `exportExcel`、`exportMarkdown`、`exportWord` が各形式へ変換する。

#### 新規型 `ReportExportFormat`

**属性・型**

```text
ReportExportFormat = 'excel' | 'markdown' | 'word'
```

**方針**

- `ReportExportFormat` は3形式、`ExportBlock` は見出し・本文・表、`ReportExporter` はブロック列からバイト列または文字列を返す。

#### 新規型 `ExportBlock`

**属性・型**

```text
ExportBlock = { kind: 'heading'; level: number; text: string } | { kind: 'paragraph'; text: string } | { kind: 'table'; table: ExportTable }
```

**方針**

- `ReportExportFormat` は3形式、`ExportBlock` は見出し・本文・表、`ReportExporter` はブロック列からバイト列または文字列を返す。

#### 新規型 `ReportExporter`

**属性・型**

```text
ReportExporter = (blocks: readonly ExportBlock[]) => Promise<Uint8Array | string>
```

**方針**

- `ReportExportFormat` は3形式、`ExportBlock` は見出し・本文・表、`ReportExporter` はブロック列からバイト列または文字列を返す。

**処理・互換性の補足** 表と見出しを含む中間出力を resolveReport の成功結果から組み立て、形式ごとに書き出す。図や専用部品の扱いは形式ごとに定義し、エラー時は未完成ファイルを最終パスに置かない。

**変更コード案**

```ts
// src/builder/export の共通入力 + src/cli/index.ts
type ReportExportFormat = 'excel' | 'markdown' | 'word';
type ExportBlock =
    | { kind: 'heading'; level: number; text: string }
    | { kind: 'paragraph'; text: string }
    | { kind: 'table'; table: ExportTable };
type ReportExporter = (blocks: readonly ExportBlock[]) => Promise<Uint8Array | string>;
const reportExporters: Record<ReportExportFormat, ReportExporter> = {
    excel: exportExcel, markdown: exportMarkdown, word: exportWord,
};
// runCli はビルド成功時の report と pages を中間ブロックへ変換して渡す。
```

**確認ケース** Excel、Markdown、Wordで同じ表の見出しと行を照合し、複数ページと出力エラーを確認する。

<a id="implementation-detail-157"></a>

## 157. `report notes`

**解決したい問題** CIやCLI作業から、仕様書に書くべき notes を機械的に列挙したい。

**現行コード** runCli には文書・比較条件・params の既存解決経路があるが、notes 一覧の分岐がない。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/expand.ts`](../../src/builder/expand.ts)

**新規パス候補** `src/builder/notes.ts`

**コード修正案** build の入力解決を共有し、専用サブコマンドが task 144 の集計を呼ぶ。正常出力と診断、終了コードは既存のCLI規則に合わせる。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` の report 分岐に notes を足す。
- 生成側と同じ文書・比較・params 解決を利用し、診断と終了コードは現行規則に合わせる。

#### 既存型の直接変更なし

**方針**

- `CliIo` と `ReportDocument` は維持する。出力は144の `NoteKeyReport` を使う。

#### 新規関数 `resolveDocumentForNotes`

**引数・戻り値**

```text
resolveDocumentForNotes(args: string[], io: CliIo): Promise<NoteDocumentResult>
```

**方針**

- `resolveDocumentForNotes(args, io)` は展開で参照したキーとnotesを返す。

#### 新規関数 `writeNoteKeyReport`

**引数・戻り値**

```text
writeNoteKeyReport(keys: NoteKeyReport, io: CliIo): void
```

**方針**

- `writeNoteKeyReport(keys, io)` はCLI表示に整形する。

#### 新規型 `NoteDocumentResult`

**属性・型**

```text
NoteDocumentResult = { ok: true; referenced: ReadonlySet<string>; notes: Record<string, string> } | { ok: false; issues: ReportIssue[] }
```

**方針**

- この項目専用の公開型は不要。
- `ExpandResult` と `NoteKeyReport` を再利用する。

**処理・互換性の補足** runCli は文書位置、比較、パラメーターを既存の生成コマンドと同様に解決し、notesの共通処理へ渡す。出力は3種類のキーを区別し、文書解決エラーは既存の失敗終了コードで扱う。

**変更コード案**

```ts
// src/cli/index.ts の report notes 分岐
const expanded = await resolveDocumentForNotes(args, io);
if (!expanded.ok) {
    writeIssues(expanded.issues, io);
    return 1;
}
const keys = listNoteKeys(expanded.referenced, expanded.notes);
writeNoteKeyReport(keys, io);
return 0;
// resolveDocumentForNotes は report build と同じ比較・文書・パラメーター解決を使う。
```

**確認ケース** CLIとMCPが同じ文書・パラメーターで同じキーを返すことと、一部に文章がない場合の出力を確認する。

<a id="implementation-detail-158"></a>

## 158. CLI の引数を足す

**解決したい問題** 解析の並列数をコマンドから指定し、スクリプトが警告も含めて結果をJSONで読むようにしたい。

**現行コード** 並列数は resolveServerConfig の環境変数で指定でき、0は直列を意味する。CLIの出力は各分岐でテキスト等を個別に出す。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`src/analyzer/worker/workerPool.ts`](../../src/analyzer/worker/workerPool.ts)

**コード修正案** parseArgs に threads、quiet、json を加え、threads には既存と同じ0以上の整数を許す。CLI指定を環境値より優先し、JSON出力を1値に集約する。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` の parseArgs を拡張し、threads を `resolveServerConfig` の結果へ重ねる。
- 出力経路で JSON と quiet の優先順を適用する。

#### 既存関数 `resolveServerConfig`

**引数・戻り値**

```text
resolveServerConfig(env?: NodeJS.ProcessEnv, cwd?: string): Promise<ServerConfig>
```

**方針**

- `runCli` の parseArgs を拡張し、threads を `resolveServerConfig` の結果へ重ねる。

#### 既存型 `ServerConfig`

**属性・型**

```text
ServerConfig { threads?: number }
```

**方針**

- `ServerConfig.threads` の0以上の整数という契約は維持する。
- CLI向けに出力形式を持つ内部値を追加する。

#### 新規関数 `writeCliResult`

**引数・戻り値**

```text
writeCliResult<T>(result: T, warnings: readonly ReportIssue[], mode: CliOutputMode, io: CliIo): void
```

**方針**

- `ThreadsArgument` が指定文字列を検証し、`writeCliResult(result, warnings, mode, io)` が構造化結果または通常出力を扱う。

#### 新規型 `ThreadsArgument`

**属性・型**

```text
ThreadsArgument: ZodType<number, string>
```

**方針**

- JSONの包みは success/result/warnings の形をコマンド間でそろえる。

#### 新規型 `CliOutputMode`

**属性・型**

```text
CliOutputMode = 'text' | 'quiet' | 'json'
```

**方針**

- `CliOutputMode` は text/quiet/json。

#### 新規型 `CliJsonResult`

**属性・型**

```text
CliJsonResult<T> { success: boolean; result?: T; warnings: readonly ReportIssue[] }
```

**方針**

- JSONの包みは success/result/warnings の形をコマンド間でそろえる。


**変更コード案**

```ts
// src/cli/index.ts の parseArgs 定義に追加
const outputOptions = {
    threads: { type: 'string' },
    quiet: { type: 'boolean' },
    json: { type: 'boolean' },
} as const;
type CliOutputMode = 'text' | 'quiet' | 'json';
// JSONでは結果と warnings を一つの値にまとめ、通常の進捗文は標準出力へ混ぜない。
```

**適用箇所のコード案**

```ts
// src/cli/index.ts の parseArgs 結果から現行環境設定へ引き渡す
const ThreadsArgument = z.string().regex(/^\d+$/).transform(Number)
    .pipe(z.number().int().nonnegative());
const threadSetting = values.threads === undefined
    ? undefined
    : ThreadsArgument.parse(values.threads);
const cliConfig = threadSetting === undefined
    ? serverConfig
    : { ...serverConfig, threads: threadSetting };
// 0 は既存の直列実行。JSON と quiet が両方指定された場合は JSON の出力形式を優先する。
```

**確認ケース** 不正threads、quietの成功・失敗、警告付きJSONが再パース可能かを確認する。

<a id="implementation-detail-159"></a>

## 159. MCP で雛形を返すツール

**解決したい問題** MCPクライアントから利用可能な雛形を列挙し、選んだ雛形を差し替え用のJSONとして取得したい。

**現行コード** REPORT_TEMPLATES は CLI の new/templates 用。MCP の reportTools は部品・provider等の案内を返すが、利用者の雛形を含む共通の一覧と取得がない。

**主な修正先** [`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)、[`src/mcp/server.ts`](../../src/mcp/server.ts)、[`src/mcp/catalogResources.ts`](../../src/mcp/catalogResources.ts)、[`src/report/templateList.ts`](../../src/report/templateList.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)

**コード修正案** 組込み・利用者の雛形へ安定IDを振り、共通索引を両ツールで使用する。入力キーの衝突規則を定義し、取得時に文書スキーマを検証する。

### 関数・型の変更一覧

#### 既存関数 `registerReportTools`

**引数・戻り値**

```text
registerReportTools(server: McpServer, source: ProcessorSource, options?: ReportToolOptions): void
```

**方針**

- `registerReportTools` に一覧と取得を登録し、`REPORT_TEMPLATES` と利用者雛形の集合を同じ索引へ渡す。

#### 既存型の直接変更なし

**方針**

- `TemplateEntry` の description/document は維持する。既存の組込み雛形の名前は引き続きCLIでも受け付ける。

#### 新規関数 `templateIndex`

**引数・戻り値**

```text
templateIndex(userTemplates: readonly IndexedTemplate[]): Map<string, IndexedTemplate>
```

**方針**

- `templateIndex(userTemplates)` は出所付きの索引を生成する。

#### 新規関数 `listReportTemplates`

**引数・戻り値**

```text
listReportTemplates(index: ReadonlyMap<string, IndexedTemplate>): TemplateSummary[]
```

**方針**

- `listReportTemplates(index)` と `getReportTemplate(index, id)` は一覧と文書取得を担当する。

#### 新規関数 `getReportTemplate`

**引数・戻り値**

```text
getReportTemplate(index: ReadonlyMap<string, IndexedTemplate>, id: string): ReportDocument | undefined
```

**方針**

- `listReportTemplates(index)` と `getReportTemplate(index, id)` は一覧と文書取得を担当する。

#### 新規型 `IndexedTemplate`

**属性・型**

```text
IndexedTemplate = TemplateEntry & { id: string; origin: 'builtin' | 'user' }
```

**方針**

- `IndexedTemplate` は `TemplateEntry` に識別子と builtin/user の出所を加える。

#### 新規型 `TemplateSummary`

**属性・型**

```text
TemplateSummary { id: string; origin: 'builtin' | 'user'; description: string }
```

**方針**

- `IndexedTemplate` は `TemplateEntry` に識別子と builtin/user の出所を加える。

**処理・互換性の補足** templateList の返す既定雛形と設定上の利用者雛形を同じ識別子規則で一覧化する。取得ツールは識別子を受けて JSONを返し、競合時に採用する規則を一覧にも反映する。

**変更コード案**

```ts
// src/report/templateList.ts + src/mcp/reportTools.ts
type IndexedTemplate = TemplateEntry & { id: string; origin: 'builtin' | 'user' };
function templateIndex(userTemplates: readonly IndexedTemplate[]): Map<string, IndexedTemplate> {
    const index = new Map<string, IndexedTemplate>();
    for (const [name, template] of Object.entries(REPORT_TEMPLATES)) {
        const id = 'builtin:' + name;
        index.set(id, { ...template, id, origin: 'builtin' });
    }
    for (const template of userTemplates) index.set(template.id, template);
    return index;
}
// 一覧と取得は同じ index を使い、取得時だけ entry.document() を呼ぶ。
```

**確認ケース** 組込みだけ、利用者が追加した雛形、同名、存在しないIDで一覧と取得の整合性を確認する。

<a id="implementation-detail-160"></a>

## 160. 設定ファイル

**解決したい問題** 複数プロジェクトがそれぞれ保存先や雛形ディレクトリを持つ場合に、環境変数を毎回組み直さず設定を確認したい。

**現行コード** resolveServerConfig は cwd、環境変数、既定値から repositoryRoot/savingRoot/threads を決め、CLIでも利用する。プロジェクト設定ファイルの読み込みはない。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/mcp/server.ts`](../../src/mcp/server.ts)、[`src/mcp/context.ts`](../../src/mcp/context.ts)、[`src/builder/inputs.ts`](../../src/builder/inputs.ts)

**新規パス候補** `src/config.ts`

**コード修正案** 先に対象ルートを解決して設定を読む。既定値、ファイル、環境変数、明示引数の優先順を決め、既存の threads=0 と保存先の挙動を保つ。

### 関数・型の変更一覧

#### 既存関数 `resolveServerConfig`

**引数・戻り値**

```text
resolveServerConfig(env?: NodeJS.ProcessEnv, cwd?: string): Promise<ServerConfig>
```

**方針**

- `resolveServerConfig` は対象ルート確定後に設定ファイルを読む。

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` は明示引数を反映し、config show は同じ実効値を出す。

#### 既存型 `ServerConfig`

**属性・型**

```text
ServerConfig { repositoryRoot: string; savingRoot: string; threads?: number; templateDirectories?: string[] }
```

**方針**

- `ServerConfig` の repositoryRoot/savingRoot/threads を使い続け、必要な場合だけ雛形ディレクトリを任意で追加する。

#### 新規関数 `readProjectConfig`

**引数・戻り値**

```text
readProjectConfig(repositoryRoot: string): Promise<ProjectConfig>
```

**方針**

- `readProjectConfig(repositoryRoot)` はJSONをZod検証し、ファイルなしだけを空設定とする。

#### 新規関数 `effectiveConfig`

**引数・戻り値**

```text
effectiveConfig(defaults: ProjectConfig, file: ProjectConfig, environment: ProjectConfig, explicit: ProjectConfig): ProjectConfig
```

**方針**

- `effectiveConfig(defaults, file, environment, explicit)` は優先順に合成する。

#### 新規型 `ProjectConfig`

**属性・型**

```text
ProjectConfig { savingRoot?: string; threads?: number; templateDirectories?: string[] }
```

**方針**

- `ProjectConfigSchema` は保存先・0以上のthreads・雛形ディレクトリ。
- 合成時は未定義値で設定を上書きしない。


**変更コード案**

```ts
// src/config.ts
const Config = z.object({
    threads: z.number().int().nonnegative().optional(),
    templateDirectories: z.array(z.string()).optional(),
    savingRoot: z.string().optional(),
}).strict();
type Config = z.infer<typeof Config>;
function effectiveConfig(defaults: Config, file: Config, environment: Config, explicit: Config): Config {
    const provided = Object.fromEntries(Object.entries(explicit).filter(([, value]) => value !== undefined));
    return Config.parse({ ...defaults, ...file, ...environment, ...provided });
}
// 読込時にファイル内の相対パスを解決し、CLI と MCP は同じ結果を使う。
```

**適用箇所のコード案**

```ts
// src/config.ts で現行の ServerConfig に合わせた読込項目
const ProjectConfigSchema = z.object({
    savingRoot: z.string().min(1).optional(),
    threads: z.number().int().nonnegative().optional(),
    templateDirectories: z.array(z.string().min(1)).optional(),
}).strict();
async function readProjectConfig(repositoryRoot: string) {
    const file = path.join(repositoryRoot, 'sf-metascope.config.json');
    try {
        const text = await fs.readFile(file, 'utf8');
        return ProjectConfigSchema.parse(JSON.parse(text));
    } catch (error) {
        if (isFileNotFound(error)) return {};
        throw error;
    }
}
// resolveServerConfig が repositoryRoot を確定した後に呼ぶ。
// SF_METASCOPE_BASE_DIR と SF_METASCOPE_THREADS はファイルの値より優先する。
```

**確認ケース** 設定なし、設定だけ、明示引数で上書き、型不正、相対パスをCLIとMCPで確認する。

<a id="implementation-detail-161"></a>

## 161. 初めての読み込みの進み具合

**解決したい問題** 大規模組織を最初に解析するときに、読み込み中か停止・失敗かをMCPから知りたい。

**現行コード** makeProcessorLoader は初回 Promise を共有し、必要なら基準を保存する。途中の状態を返すインターフェースはない。

**主な修正先** [`src/mcp/server.ts`](../../src/mcp/server.ts)、[`src/mcp/context.ts`](../../src/mcp/context.ts)、[`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`src/analyzer/worker/workerPool.ts`](../../src/analyzer/worker/workerPool.ts)

**コード修正案** 入力ごとの状態を loader に持たせ、探索・解析・初回保存からイベントを出す。進捗通知を受け取れる呼出しと、状態照会の双方が同じ状態型を参照する。

### 関数・型の変更一覧

#### 既存関数 `makeProcessorLoader`

**引数・戻り値**

```text
makeProcessorLoader(config: ServerConfig): () => Promise<RepositoryProcessor>
```

**方針**

- `makeProcessorLoader` は共有する初回Promiseの各フェーズを記録する。

#### 既存関数 `RepositoryProcessor.create`

**引数・戻り値**

```text
RepositoryProcessor.create(savingRoot: string, repositoryRoot: string, options?: RepositoryProcessorOptions): Promise<RepositoryProcessor>
```

**方針**

- `RepositoryProcessor.create` と初回 `save` の完了・失敗を通知へつなぐ。

#### 既存型の直接変更なし

**方針**

- 既存の `ProcessorSource` と既存呼び出しは維持し、任意の通知や状態照会をローダー境界で扱う。

#### 新規関数 `recordInitialLoad`

**引数・戻り値**

```text
recordInitialLoad(inputId: string, state: InitialLoadState): void
```

**方針**

- `recordInitialLoad(inputId, state)` は入力別の状態を更新する。

#### 新規関数 `initialLoadStatus`

**引数・戻り値**

```text
initialLoadStatus(inputId: string): InitialLoadState | undefined
```

**方針**

- `initialLoadStatus(inputId)` はMCPの照会から状態を返す。

#### 新規型 `InitialLoadState`

**属性・型**

```text
InitialLoadState = { status: 'loading'; phase: 'locate' | 'parse' | 'save'; completed?: number; total?: number } | { status: 'ready' } | { status: 'failed'; message: string }
```

**方針**

- `InitialLoadState` は loading のフェーズ・件数、ready、failed のメッセージを表す。

**処理・互換性の補足** 読込元の探索、対象確定、単位の解析といった段階を context へ伝える。MCP側では初回処理の識別子と進行・完了・失敗を保持し、通知可能な経路に進捗を流す。

**変更コード案**

```ts
// src/mcp/context.ts
type InitialLoadState =
    | { status: 'loading'; phase: 'locate' | 'parse'; completed?: number; total?: number }
    | { status: 'ready' }
    | { status: 'failed'; message: string };
const loadStates = new Map<string, InitialLoadState>();
function recordInitialLoad(inputId: string, state: InitialLoadState) {
    loadStates.set(inputId, state);
}
// inputId は解決済みルートと入力種別の組。進捗通知と照会は同じ状態を参照する。
```

**確認ケース** 初回とキャッシュ済み、ロード失敗、同時に別の入力を開く場合で進捗が混ざらないことを確認する。

<a id="implementation-detail-162"></a>

## 162. 保存先の `.gitignore` を知らせる

**解決したい問題** 保存先が既定の .sf-metascope 以外の場合に、プロジェクトの .gitignore に追加できる具体的なパターンを知りたい。

**現行コード** context.ts は既定の保存先と .gitignore のコメントを持つ。設定で変わった実パスを相対パターンとして出力しない。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/mcp/context.ts`](../../src/mcp/context.ts)、[`src/analyzer/unit/store.ts`](../../src/analyzer/unit/store.ts)、[`src/analyzer/unit/repository.ts`](../../src/analyzer/unit/repository.ts)、[`.gitignore`](../../.gitignore)

**コード修正案** 解決後の savingRoot と repositoryRoot からパターンを求める。区切り・特殊文字を正規化し、ルート外や既に無視される場合の出力を区別する。

### 関数・型の変更一覧

#### 既存関数 `resolveServerConfig`

**引数・戻り値**

```text
resolveServerConfig(env?: NodeJS.ProcessEnv, cwd?: string): Promise<ServerConfig>
```

**方針**

- `resolveServerConfig` または利用側は解決済み repositoryRoot/savingRoot から案内を生成する。
- ルート外や既に無視される場合の応答を分ける。

#### 既存型の直接変更なし

**方針**

- `ServerConfig` は既存の2パスで十分。保存データやGit設定の型に変更は不要。

#### 新規関数 `ignorePatternForStore`

**引数・戻り値**

```text
ignorePatternForStore(root: string, directory: string): string | undefined
```

**方針**

- `ignorePatternForStore(root, directory)` は有効な相対パターンまたは undefined を返す。

#### 新規関数 `escapeGitignoreSegment`

**引数・戻り値**

```text
escapeGitignoreSegment(segment: string): string
```

**方針**

- `escapeGitignoreSegment` は特殊文字をエスケープする。

#### 新規型なし

**方針**

- 新規公開型は不要。必要な案内は既存のCLI/MCP応答へ載せる。

**処理・互換性の補足** 現在選択された保存先をプロジェクトルートからの相対パスへ変換し、対象がルート内なら対応するパターンを案内する。プロジェクト外の保存先ではその位置を表示する。

**変更コード案**

```ts
// src/analyzer/unit/store.ts
function ignorePatternForStore(root: string, directory: string): string | undefined {
    const relative = path.relative(root, directory);
    if (!relative || path.isAbsolute(relative) || relative.split(path.sep)[0] === '..') return undefined;
    const segments = relative.split(path.sep).map(escapeGitignoreSegment);
    return '/' + segments.join('/') + '/';
}
// ルート外はパターンを出さず保存場所を表示し、既存の .gitignore は参照のみとする。
```

**確認ケース** ルート内・ルート外、Windowsの区切り、無視設定済みの場合の案内を確認する。

<a id="implementation-detail-163"></a>

## 163. 配布の形

**解決したい問題** インストールしたパッケージだけで report new と viewer 付きの生成が動くようにしたい。

**現行コード** package.json には bin、version、ISC license がすでにある。files の範囲と生成済みカタログを tarball から参照できるかは確認が必要。

**主な修正先** [`package.json`](../../package.json)、[`bin/sf-metascope.mjs`](../../bin/sf-metascope.mjs)、[`vite.node.config.ts`](../../vite.node.config.ts)、[`src/cli/index.ts`](../../src/cli/index.ts)、[`docs/catalog/`](../../docs/catalog/)、[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

**新規パス候補** `LICENSE`

**コード修正案** 既存binの起動先、viteのdist、雛形とスキーマの配布位置を照合してfilesを定義する。pack内容と新規プロジェクトのインストール後の実行を確認する。

### 関数・型の変更一覧

#### 既存関数 `documentSchemaPath`

**引数・戻り値**

```text
documentSchemaPath(): Promise<string | undefined>
```

**方針**

- `documentSchemaPath` と `defaultReportTemplate` のパス解決をパッケージ配置で確認し、不一致時はファイル位置の探索を更新する。
- `bin/sf-metascope.mjs` の起動先を配布物と照合する。

#### 既存関数 `defaultReportTemplate`

**引数・戻り値**

```text
defaultReportTemplate(): string
```

**方針**

- `documentSchemaPath` と `defaultReportTemplate` のパス解決をパッケージ配置で確認し、不一致時はファイル位置の探索を更新する。

#### 既存型の直接変更なし

**方針**

- 既存のTypeScriptインターフェースの変更は不要。package.json の files、bin、scripts、license を使う。

#### 新規関数なし

**方針**

- 成果物内のファイル存在を検証する入口をCIで実行する。実行時の関数追加は、既存パス解決で不足が判明した場合に限る。

#### 新規型なし

**方針**

- 新規TypeScript型は不要。npmパッケージ設定と成果物で契約を表す。

**処理・互換性の補足** package.json の files と bin を実際の成果物へ合わせ、文書スキーマ、雛形、必要なviewer資材が tarball に入ることを一覧で確認する。公開は別途確認できる状態にし、まずパッケージからの実行を検証する。

**変更コード案**

```json
{
    "bin": {
        "sf-metascope": "bin/sf-metascope.mjs"
    },
    "files": [
        "bin/sf-metascope.mjs",
        "dist/",
        "docs/catalog/report-document.schema.json",
        "docs/catalog/templates/"
    ],
    "license": "ISC",
    "scripts": {
        "prepack": "npm run build"
    }
}
```

**確認ケース** 空のプロジェクトに tarball を入れて CLI のヘルプ、report new、レポート生成、スキーマ参照を確認する。

<a id="implementation-detail-164"></a>

## 164. 作ったレポートの一覧と作り直し

**解決したい問題** 元の Salesforce メタデータが更新されたとき、作成済みレポートをまとめて作り直したい。

**現行コード** writeReportSite は出力を返すが、どの入力・比較・パラメーターで作ったかを再実行用の索引に記録しない。

**主な修正先** [`src/cli/index.ts`](../../src/cli/index.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/pages.ts`](../../src/builder/pages.ts)

**新規パス候補** `src/builder/reportManifest.ts`

**コード修正案** 成功時に出力ファイルをキーとする永続記録を追加する。rebuild は記録を通常の生成入口に渡し、個別失敗と全体の終了状態を集約する。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` の生成成功後に再生成情報を記録し、rebuild は同じビルド入口を呼び出す。
- `writeReportSite` の成果物が成功した場合だけ更新する。

#### 既存型の直接変更なし

**方針**

- `ResolvedReport` の出力は維持する。比較値は `DataComparison` を再利用し、記録形式は版付きの別型にする。

#### 新規関数 `upsertReport`

**引数・戻り値**

```text
upsertReport(manifest: ReportManifest, entry: ReportManifestEntry): ReportManifest
```

**方針**

- `upsertReport(manifest, entry)` が出力パスで置換する。

#### 新規関数 `readReportManifest`

**引数・戻り値**

```text
readReportManifest(file: string): Promise<ReportManifest>
```

**方針**

- `readReportManifest`、`writeReportManifest`、`rebuildReports` が保存・検証・逐次再実行を担当する。

#### 新規関数 `writeReportManifest`

**引数・戻り値**

```text
writeReportManifest(file: string, manifest: ReportManifest): Promise<void>
```

**方針**

- `readReportManifest`、`writeReportManifest`、`rebuildReports` が保存・検証・逐次再実行を担当する。

#### 新規関数 `rebuildReports`

**引数・戻り値**

```text
rebuildReports(entries: readonly ReportManifestEntry[], build: (entry: ReportManifestEntry) => Promise<void>): Promise<RebuildResult[]>
```

**方針**

- `readReportManifest`、`writeReportManifest`、`rebuildReports` が保存・検証・逐次再実行を担当する。

#### 新規型 `ReportManifestEntry`

**属性・型**

```text
ReportManifestEntry { output: string; document: string; project: string; comparison?: DataComparison; params?: Record<string, unknown> }
```

**方針**

- `ReportManifestEntry` は出力、文書、プロジェクト、比較、params。

#### 新規型 `ReportManifest`

**属性・型**

```text
ReportManifest { version: 1; entries: ReportManifestEntry[] }
```

**方針**

- `ReportManifestEntry` は出力、文書、プロジェクト、比較、params。
- `ReportManifest` は版と記録配列。

#### 新規型 `RebuildResult`

**属性・型**

```text
RebuildResult = { output: string; ok: true } | { output: string; ok: false; message: string }
```

**方針**

- `ReportManifestEntry` は出力、文書、プロジェクト、比較、params。

**処理・互換性の補足** 生成成功時だけ入力、比較、パラメーター、出力先の対応をマニフェストに記録する。rebuild --all は安定順で各項目を既存ビルドに渡し、成功と失敗を最後に集約する。

**変更コード案**

```ts
// src/builder/reportManifest.ts
type ReportManifestEntry = {
    output: string;
    document: string;
    project: string;
    comparison?: DataComparison;
    params?: Record<string, unknown>;
};
type ReportManifest = { version: 1; entries: ReportManifestEntry[] };
function upsertReport(manifest: ReportManifest, entry: ReportManifestEntry): ReportManifest {
    const entries = manifest.entries.filter(({ output }) => output !== entry.output);
    return { version: 1, entries: [...entries, entry] };
}
// パスを正規化してから upsert し、書き込みは一時ファイル経由で置き換える。
```

**確認ケース** 複数レポートの再実行、一件の入力消失、同じ出力の再作成で記録の重複や上書きを確認する。
