# 4. ビルドと文書（`src/builder`・`src/report`）の実装詳細

[実装タスク別の変更先と実装方針](../implementation-task-paths.md) ・ [元の実装タスク一覧](../implementation-tasks.md)

「現行コード」は調査時点の実装に基づきます。「コード修正案」とコードブロックは変更後の案です。省略したヘルパーと型は、記載のファイルに組み込むときに実装または既存処理へ接続します。確認ケースは実装後に検証する内容です。

各項目の「関数・型の変更一覧」では、定義名ごとに変更後のシグネチャまたは型の関係する属性と、その定義の実装方針を示します。追加候補の名前は計画上の名前です。

<a id="implementation-detail-126"></a>

## 126. where だけ違う同じデータを使い回す

**解決したい問題** メソッドを50件並べた Apex 仕様書で、同じクラスのフローを50回作らず、各ページに必要な行だけを表示したい。

```json
{
    "methodA": {
        "provider": "apex.methodFlow",
        "args": { "classes": ["AccountService"] },
        "where": { "signature": "a()" }
    },
    "methodB": {
        "provider": "apex.methodFlow",
        "args": { "classes": ["AccountService"] },
        "where": { "signature": "b()" }
    }
}
```

**現行コード** reportBuilder.ts の sourceRunner は JSON.stringify(source) をキーにする。runSource には provider実行、where、withSource、compactEmbeddedData が一体で入り、where が違うだけで別の実行になる。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`test/report/report-builder.test.ts`](../../test/report/report-builder.test.ts)

**コード修正案** provider・検証済み引数・比較条件で実行キャッシュ、where・withSource を含む宣言で表示用キャッシュを分ける。検証エラーは元の path、オブジェクト結果への where は path.where へ返す。

### 関数・型の変更一覧

#### 既存関数 `sourceRunner`

**引数・戻り値**

```text
sourceRunner(input: ReportInput, options: ResolveReportOptions, issues: ReportIssue[]): (source: ReportDataSource, path: string) => SourceResult | undefined
```

**方針**

- 宣言単位と provider 実行単位の処理を分ける。where や withSource だけが異なる宣言は実行結果を共有し、表示結果は各宣言ごとに生成する。

#### 既存関数 `runSource`

**引数・戻り値**

```text
runSource(source: ReportDataSource, path: string, input: ReportInput, options: ResolveReportOptions, issues: ReportIssue[]): SourceResult | undefined
```

**方針**

- 既存の検証・比較入力選択を prepareSource へ移し、provider 実行と表示結果への投影を別々に呼ぶ。この関数が不要になれば統合する。

#### 既存型の直接変更なし

**方針**

- `ReportDataSource` と `SourceResult` は維持する。実行キーに正規化引数を使い、provider の呼び出しには既存経路と同じ引数を渡す。

#### 新規関数 `prepareSource`

**引数・戻り値**

```text
prepareSource(source: ReportDataSource, path: string, input: ReportInput, options: ResolveReportOptions, issues: ReportIssue[]): PreparedSource | undefined
```

**方針**

- provider と引数を検証し、比較条件が参照する before/after の組を確定する。失敗時は宣言元の path に診断を追加し、undefined を返す。

#### 新規関数 `runCached`

**引数・戻り値**

```text
runCached(prepared: PreparedSource): unknown
```

**方針**

- provider・正規化引数・比較キーで実行結果を引く。未実行の場合にだけ元の引数で provider を呼び、where 適用前の結果を保存する。

#### 新規関数 `projectResult`

**引数・戻り値**

```text
projectResult(all: unknown, source: ReportDataSource, prepared: PreparedSource, path: string): SourceResult | undefined
```

**方針**

- 各宣言に対応する where を適用し、配列以外への where はその宣言の path.where で通知する。次に必要なソースを添付し、埋め込み向けに圧縮する。

#### 新規型 `PreparedSource`

**属性・型**

```text
PreparedSource { provider: ReportProviderName; args: ReportDataSource['args']; normalizedArgs: unknown; comparisonKey: string | null; dataInput: ReportInput; compared?: string }
```

**方針**

- provider の呼出し用引数とキー用の正規化値を分けて保持する。比較キー、選択済み入力、表示用ラベルもここに集める。

**処理・互換性の補足** sourceRunner に provider・検証済み引数・comparisonKey の実行キャッシュを置く。キャッシュした元結果に呼出しごとの where と withSource を適用し、最後に compactEmbeddedData を通す。providerエラーと where 非対応は別の診断として保持する。

**変更コード案**

```ts
// src/builder/reportBuilder.ts の sourceRunner 内
type PreparedSource = {
    provider: ReportProviderName;
    args: ReportDataSource['args'];
    normalizedArgs: unknown;
    comparisonKey: string | null;
    dataInput: ReportInput;
    compared?: string;
};
const providerRuns = new Map<string, { all: unknown }>();
function runCached(prepared: PreparedSource): unknown {
    const key = JSON.stringify([
        prepared.provider, stableArgs(prepared.normalizedArgs), prepared.comparisonKey,
    ]);
    const prior = providerRuns.get(key);
    if (prior) return prior.all;
    const all = runReportProvider(prepared.provider, prepared.dataInput, prepared.args, options);
    providerRuns.set(key, { all });
    return all;
}
function projectResult(all: unknown, source: ReportDataSource, prepared: PreparedSource, path: string) {
    if (source.where && !Array.isArray(all)) {
        issues.push({ path: path + '.where', message: 'where requires rows.' });
        return undefined;
    }
    const filtered = source.where && Array.isArray(all) ? filterRows(all, source.where) : all;
    const output = source.withSource ? attachSources(filtered, prepared.dataInput) : filtered;
    return {
        value: compactEmbeddedData(output, prepared.dataInput.after.root),
        ...(prepared.compared === undefined ? {} : { compared: prepared.compared }),
    };
}
// 既存 runSource の入力検証と比較入力の解決を準備処理へ移す。
// sourceRunner の返す関数は prepare → runCached → projectResult の順に実行する。
```

**適用箇所のコード案**

```ts
// src/builder/reportBuilder.ts の sourceRunner が返す関数
return (source, sourcePath) => {
    const prepared = prepareSource(source, sourcePath, input, options, issues);
    if (!prepared) return undefined;
    let all: unknown;
    try {
        all = runCached(prepared);
    } catch (error) {
        issues.push({ path: sourcePath, message: 'Provider failed: ' + String(error) });
        return undefined;
    }
    return projectResult(all, source, prepared, sourcePath);
};
// prepareSource: 現行 runSource の provider 名・args 検証と、
// comparisonOfSource / inputFor / requiresComparison の処理を移す。
// 正規化引数はキャッシュキー用、元の引数は runReportProvider に渡して現行の変換を維持する。
```

**確認ケース** 同一providerで条件だけが違う2件が実行1回で別結果になること、異なる比較では再実行されること、withSource の指定と診断パスを確認する。

<a id="implementation-detail-127"></a>

## 127. 同じデータを 1 つにまとめて埋め込む

**解決したい問題** 同じレポートの見出しと表が同じ項目一覧を持つとき、同内容のデータを別名ごとにHTMLへ重複して埋め込みたくない。

**現行コード** resolveReport は doc.data の名前ごとに state.data[name] を代入し、splitPages はその名前で状態を選ぶ。値が同じでも別の名前は別エントリーとしてシリアライズされる。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/report/embedding.ts`](../../src/report/embedding.ts)、[`src/viewer/report/main.tsx`](../../src/viewer/report/main.tsx)

**コード修正案** ビルド時にデータ出力IDを割り当て、従来の参照名は別名として持つ。比較ラベルはデータ本体から独立させ、viewer の初期化時に既存 state 参照を復元する。

### 関数・型の変更一覧

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- `resolveReport` が表示データへIDを付け、`splitPages` と `stateOf` がページに必要なIDだけを選ぶ。
- viewer は従来の名前参照を読み込み時に復元する。

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `resolveReport` が表示データへIDを付け、`splitPages` と `stateOf` がページに必要なIDだけを選ぶ。

#### 既存関数 `stateOf`

**引数・戻り値**

```text
stateOf(state: State, names: Set<string>): State
```

**方針**

- `resolveReport` が表示データへIDを付け、`splitPages` と `stateOf` がページに必要なIDだけを選ぶ。

#### 既存型 `State`

**属性・型**

```text
State { data: Record<string, unknown>; compared?: Record<string, string>; dataIndex?: EmbeddedDataIndex }
```

**方針**

- `EmbeddedReport`／内部 `State` に任意のデータ索引を通す。
- レガシーの `state.data` と名前ごとの compared を読み込める状態を保つ。

#### 既存型 `EmbeddedReport`

**属性・型**

```text
EmbeddedReport { spec: Spec & { state: State } }
```

**方針**

- `EmbeddedReport`／内部 `State` に任意のデータ索引を通す。

#### 新規関数 `stateForPage`

**引数・戻り値**

```text
stateForPage(index: EmbeddedDataIndex, names: ReadonlySet<string>): EmbeddedDataIndex
```

**方針**

- `stateForPage(index, names)` は名前→IDと必要な値をページ用に選ぶ。

#### 新規関数 `restoreEmbeddedData`

**引数・戻り値**

```text
restoreEmbeddedData(index: EmbeddedDataIndex): State
```

**方針**

- `restoreEmbeddedData(index)` は既存 viewer 用の状態へ戻す。

#### 新規型 `EmbeddedDataIndex`

**属性・型**

```text
EmbeddedDataIndex { valuesById: Record<string, unknown>; idsByName: Record<string, string>; comparedByName?: Record<string, string> }
```

**方針**

- `EmbeddedDataIndex` は ID→値、名前→ID、任意の名前→比較ラベル。

**処理・互換性の補足** 解決後のデータ値と比較ラベルなどの付帯情報を区別する。由来を共有できるデータにIDを割り当て、state 名は別名表で維持する。splitPages はページごとの参照先を収集する。

**変更コード案**

```ts
// src/builder/reportBuilder.ts + pages.ts
type EmbeddedDataIndex = {
    valuesById: Record<string, unknown>;
    idsByName: Record<string, string>;
    comparedByName?: Record<string, string>;
};
function stateForPage(index: EmbeddedDataIndex, names: ReadonlySet<string>) {
    const idsByName = Object.fromEntries(
        Object.entries(index.idsByName).filter(([name]) => names.has(name))
    );
    const ids = new Set(Object.values(idsByName));
    const valuesById = Object.fromEntries(Object.entries(index.valuesById).filter(([id]) => ids.has(id)));
    return { idsByName, valuesById };
}
// viewer で data.<name> の既存 state を復元し、比較ラベルは名前ごとに維持する。
```

**確認ケース** 別名が同じ値を指す例、比較ラベルだけ違う例、出力HTMLを単独で開く場合に内容が一致することを確認する。

<a id="implementation-detail-128"></a>

## 128. 大きい文書のビルドの進み具合を知らせる

**解決したい問題** NPSP 規模の仕様書生成の待ち時間中に、解析・データ生成・ページ出力のどこまで進んだかを知りたい。

**現行コード** resolveReport は同期で最終結果を返し、writeReportSite はページを順に書き込む。両方の段階を外から観測する共通コールバックがない。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/cli/index.ts`](../../src/cli/index.ts)、[`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)

**新規パス候補** `docs/examples/report/scripts/benchmark-report.ts`

**コード修正案** 解決開始・終了、各provider実行、書き込みページ数を進捗にする。同期処理の通知が UI まで即時に届くかを確認し、必要ならCLI/MCPの実行境界で段階を分ける。

### 関数・型の変更一覧

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- `resolveReport` は解決の段階、`writeReportSite` は出力件数を通知する。

#### 既存関数 `writeReportSite`

**引数・戻り値**

```text
writeReportSite(resolved: { report: EmbeddedReport; pages?: { file: string; report: EmbeddedReport }[] }, outputPath: string, templatePath?: string, onProgress?: ProgressCallback): Promise<string>
```

**方針**

- `resolveReport` は解決の段階、`writeReportSite` は出力件数を通知する。

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` と `registerReportTools` が任意のリスナーを接続する。

#### 既存関数 `registerReportTools`

**引数・戻り値**

```text
registerReportTools(server: McpServer, source: ProcessorSource, options?: ReportToolOptions): void
```

**方針**

- `runCli` と `registerReportTools` が任意のリスナーを接続する。

#### 既存型 `ResolveReportOptions`

**属性・型**

```text
ResolveReportOptions { onProgress?: ProgressCallback }
```

**方針**

- `ResolveReportOptions` に任意の onProgress、書出し側にも任意の進捗設定を加える。
- 既存呼び出しの位置引数は維持する。

#### 新規関数 `benchmarkReport`

**引数・戻り値**

```text
benchmarkReport(input: ReportInput): BenchmarkResult
```

**方針**

- 計測スクリプトが `benchmarkReport(input)` で進捗と時刻を収集する。
- 同期の通知処理は既存関数内で呼ぶ。

#### 新規型 `ReportProgress`

**属性・型**

```text
ReportProgress = { phase: 'resolve'; status: 'started' | 'done' } | { phase: 'providers' | 'pages'; completed: number; total?: number } | { phase: 'finished'; status: 'ok' | 'error' }
```

**方針**

- `ReportProgress` はフェーズ、完了件数・任意の総件数、最終状態の判別共用体。

#### 新規型 `ProgressCallback`

**属性・型**

```text
ProgressCallback = (progress: ReportProgress) => void
```

**方針**

- `ProgressCallback` はその通知関数。

#### 新規型 `BenchmarkResult`

**属性・型**

```text
BenchmarkResult { elapsedMs: number; pageCount: number; events: ReportProgress[] }
```

**方針**

- 同じ入力で比較できるよう計測時間、ページ数、イベント列を保存する。対象リビジョンは計測結果の出力時に添える。

**処理・互換性の補足** 解決、provider実行、ページ書出しのフェーズを進捗に含める。総件数が分かる段階だけ分母を返し、完了や失敗を最後に通知する。計測では入力・ページ数・実行時間と初回／再実行を記録する。

**変更コード案**

```ts
// src/builder/reportBuilder.ts
type ReportProgress =
    | { phase: 'resolve'; status: 'started' | 'done' }
    | { phase: 'providers' | 'pages'; completed: number; total?: number }
    | { phase: 'finished'; status: 'ok' | 'error' };
type ProgressCallback = (progress: ReportProgress) => void;
// resolveReport の options.onProgress と writeReportSite のページ書き出しで通知する。
// benchmark-report.ts は performance.now() で計測し、入力リビジョンとページ数を保存する。
```

**確認ケース** 小規模入力でイベント順を確認し、NPSPの仕様書で測定値を再現できるよう計測条件を記録する。

<a id="implementation-detail-132"></a>

## 132. 行の中の配列を for で回す

**解決したい問題** クラスを回す for の中で、現在の行の m.items をさらに for で展開したい。

**現行コード** expand.ts の rowsOf は loop.in が文字列なら document.data[loop.in] を取得する。完全一致式を先に評価しないため、行内の配列を指定できない。

**主な修正先** [`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`test/report/expand.test.ts`](../../test/report/expand.test.ts)

**コード修正案** in を既存 fill で実値にし、文字列はデータ名、配列は直接行、rows を持つ行列はその配列として扱う。limit と警告の処理を同じ関数へ通す。

### 関数・型の変更一覧

#### 既存関数 `expandReportDocument`

**引数・戻り値**

```text
expandReportDocument(document: ReportDocument, run: SourceRunner, params?: Record<string, unknown>): ExpandResult
```

**方針**

- `expandReportDocument` の `rowsOf` が `fill` で for.in の変数式を先に評価する。
- 配列を得た経路と既存データ名／providerの経路で上限処理を共用する。

#### 既存関数 `rowsOf`

**引数・戻り値**

```text
rowsOf(loop: ReportFor, scope: Scope, key: string): unknown[] | undefined
```

**方針**

- `expandReportDocument` の `rowsOf` が `fill` で for.in の変数式を先に評価する。

#### 既存型の直接変更なし

**方針**

- `ReportFor.in` は既存の文字列とデータ宣言の union を維持する。文字列が変数式を含めることを説明と生成 schema へ反映する。

#### 新規関数 `matrixRowsOf`

**引数・戻り値**

```text
matrixRowsOf(value: unknown): unknown[] | undefined
```

**方針**

- `matrixRowsOf(value)` は rows が配列のオブジェクトだけを受け取る。

#### 新規関数 `loopRowsOf`

**引数・戻り値**

```text
loopRowsOf(value: unknown): unknown[] | undefined
```

**方針**

- `loopRowsOf(value)` は配列または行列を行配列にし、`limitLoopRows` が警告と切詰めを行う。

#### 新規関数 `limitLoopRows`

**引数・戻り値**

```text
limitLoopRows(rows: unknown[], loop: ReportFor, path: string): unknown[]
```

**方針**

- `loopRowsOf(value)` は配列または行列を行配列にし、`limitLoopRows` が警告と切詰めを行う。

#### 新規型なし

**方針**

- 公開型の追加は不要。展開時に値を `unknown` として受け取り配列を検査する。


**変更コード案**

```ts
// src/builder/expand.ts の rowsOf 内
const context = contextOf(scope, key);
const input = typeof loop.in === 'string' ? fill(loop.in, context) : loop.in;
if (Array.isArray(input)) return limitLoopRows(input, loop, path);
if (isMatrixRows(input)) return limitLoopRows(input.rows, loop, path);
const declared = typeof input === 'string' ? document.data[input] : input;
if (!declared || (typeof loop.in === 'string' && typeof input !== 'string')) {
    issues.push({ path, message: 'for.in requires a data source or an array of rows.' });
    return undefined;
}
// 従来の run + 行検証と、新しい配列経路で limitLoopRows を共用する。
```

**適用箇所のコード案**

```ts
// expand.ts の rowsOf の入口と後段
function matrixRowsOf(value: unknown): unknown[] | undefined {
    if (typeof value !== 'object' || value === null || !('rows' in value)) return undefined;
    return Array.isArray(value.rows) ? value.rows : undefined;
}
function loopRowsOf(value: unknown): unknown[] | undefined {
    return Array.isArray(value) ? value : matrixRowsOf(value);
}
// 式を展開して得た配列には loopRowsOf を使う。
// 従来の文字列データ名は document.data から解決し、入手した provider 結果にも loopRowsOf を適用する。
// 式から得たオブジェクトは配列の rows を持つ場合だけ反復し、provider 宣言として再解釈しない。
```

**確認ケース** 空配列、行の中の配列、行列、旧来のデータ名、無効なスカラーを確認する。

<a id="implementation-detail-133"></a>

## 133. for の並べ替え

**解決したい問題** 上位10件を生成するとき、元のメタデータ列挙順ではなく金額順の10件を使いたい。

**現行コード** ReportFor は as/in/limit を扱い、rowsOf は受け取った配列の先頭を切る。ソート指定はスキーマにない。

**主な修正先** [`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`test/report/expand.test.ts`](../../test/report/expand.test.ts)

**コード修正案** sort の短縮形と列・方向の明示形を追加する。rowsOf で配列を取得した直後にコピーを並べ替え、元の配列やキャッシュへの副作用を避けてから limit を適用する。

### 関数・型の変更一覧

#### 既存関数 `rowsOf`

**引数・戻り値**

```text
rowsOf(loop: ReportFor, scope: Scope, key: string): unknown[] | undefined
```

**方針**

- `rowsOf` が反復対象を得た直後に任意の sort を適用し、その後 limit を処理する。
- 既存の元データは変更しない。

#### 既存型 `ReportFor`

**属性・型**

```text
ReportFor { sort?: ForSort; limit?: number }
```

**方針**

- `ReportFor` に任意の sort を加える。
- Zodと生成Schemaの双方で文字列の短縮形とキー・方向の明示形を受ける。

#### 新規関数 `sortLoopRows`

**引数・戻り値**

```text
sortLoopRows(rows: readonly unknown[], sort: ForSort): unknown[]
```

**方針**

- `sortLoopRows(rows, sort)` はコピーを安定ソートする。

#### 新規関数 `compareLoopValues`

**引数・戻り値**

```text
compareLoopValues(left: unknown, right: unknown, direction: 'asc' | 'desc'): number
```

**方針**

- `compareLoopValues(left, right, direction)` は欠損・数値・文字列の順序を定める。

#### 新規型 `ForSort`

**属性・型**

```text
ForSort = string | { key: string; direction?: 'asc' | 'desc' }
```

**方針**

- `ForSort` は文字列または key/direction のZod union。
- 比較用の公開型は不要。

**処理・互換性の補足** 反復行の決定後、limitを適用する前に sort を評価する。初期案は列名と昇降順を持つ形式とし、既存のフィールド参照の規則と元インデックスによる同値順を使う。

**変更コード案**

```ts
// src/report/document.ts + src/builder/expand.ts
const ForSort = z.union([
    z.string().min(1),
    z.object({ key: z.string().min(1), direction: z.enum(['asc', 'desc']).default('asc') }),
]);
function sortLoopRows(rows: readonly unknown[], sort: z.infer<typeof ForSort>): unknown[] {
    const { key, direction } = typeof sort === 'string' ? { key: sort, direction: 'asc' } : sort;
    return [...rows].sort((a, b) =>
        compareLoopValues(valueAtPath(a, key), valueAtPath(b, key), direction)
    );
}
// ReportFor に sort: ForSort.optional() を追加し、limit より先に適用する。
```

**確認ケース** 降順、欠損値、同順位、limitと組み合わせた上位件数を確認する。

<a id="implementation-detail-134"></a>

## 134. where の比べ方を増やす

**解決したい問題** amount が100以上という数値条件や、name が Test で始まるという文字列条件を指定したい。

**現行コード** filterRows は fieldOf と sameValue の等値、配列なら候補とのいずれか一致を扱う。条件式の型と演算子の判別がない。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/sources.ts`](../../src/builder/sources.ts)、[`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`test/report/report-builder.test.ts`](../../test/report/report-builder.test.ts)

**コード修正案** 従来値との衝突を避ける明示的な演算子オブジェクトを追加する。文字列・数値演算子ごとの入力型を検証し、fieldOf のドット区切りの参照はそのまま共用する。

### 関数・型の変更一覧

#### 既存関数 `filterRows`

**引数・戻り値**

```text
filterRows(rows: unknown[], where: Record<string, unknown>): unknown[]
```

**方針**

- `filterRows` の列別比較を `matchesWhere` に委譲する。
- `fieldOf` と従来の `sameValue` を再利用する。

#### 既存型 `ReportDataSource`

**属性・型**

```text
ReportDataSource { where?: Record<string, unknown> }
```

**方針**

- `ReportDataSource.where` の説明とスキーマに演算子を追加する。
- 旧来のリテラル値と配列、ドット区切りキーは維持する。

#### 新規関数 `matchesWhere`

**引数・戻り値**

```text
matchesWhere(actual: unknown, expected: unknown): boolean
```

**方針**

- `matchesWhere(actual, expected)` は演算子か従来の値かを判別し、`compareWhereOperator(actual, op)` が型に応じて比較する。

#### 新規関数 `isWhereOperator`

**引数・戻り値**

```text
isWhereOperator(value: unknown): value is WhereOperator
```

**方針**

- `matchesWhere(actual, expected)` は演算子か従来の値かを判別し、`compareWhereOperator(actual, op)` が型に応じて比較する。

#### 新規関数 `compareWhereOperator`

**引数・戻り値**

```text
compareWhereOperator(actual: unknown, op: WhereOperator): boolean
```

**方針**

- `matchesWhere(actual, expected)` は演算子か従来の値かを判別し、`compareWhereOperator(actual, op)` が型に応じて比較する。

#### 新規型 `WhereOperator`

**属性・型**

```text
WhereOperator = { $op: 'neq'; value: unknown } | { $op: 'contains' | 'startsWith'; value: string } | { $op: 'gt' | 'gte' | 'lt' | 'lte'; value: number }
```

**方針**

- `WhereOperator` は $op を判別子とし、neq、文字列条件、数値条件で value の型を分ける。

**処理・互換性の補足** 既存のリテラル値と配列の等値条件を残し、演算子付き形式を別の判別可能な型で受け付ける。fieldOf のパス解決を共用し、数値比較は数値型に限定する案とする。

**変更コード案**

```ts
// src/report/document.ts + src/builder/reportBuilder.ts
type WhereOperator =
    | { $op: 'neq'; value: unknown }
    | { $op: 'contains' | 'startsWith'; value: string }
    | { $op: 'gt' | 'gte' | 'lt' | 'lte'; value: number };
function matchesWhere(actual: unknown, expected: unknown): boolean {
    if (isWhereOperator(expected)) return compareWhereOperator(actual, expected);
    if (Array.isArray(expected)) return expected.some((item) => sameValue(actual, item));
    return sameValue(actual, expected);
}
// $op は明示した演算子オブジェクトだけ判別し、既存の等値データと区別する。
```

**確認ケース** 従来の等値、配列いずれか、否定、含む、前方一致、数値比較と型不一致を確認する。

<a id="implementation-detail-135"></a>

## 135. `${` をそのまま書くエスケープ

**解決したい問題** 仕様書の例に変数の書式そのものを載せても、レポート生成で展開されないようにしたい。

**現行コード** fill は WHOLE_VARIABLE と VARIABLE を使って文字列を評価する。開始記号をリテラルとして渡す分岐がない。

**主な修正先** [`src/builder/expand.ts`](../../src/builder/expand.ts)、[`docs/report-document-format.md`](../../docs/report-document-format.md)、[`test/report/expand.test.ts`](../../test/report/expand.test.ts)

**コード修正案** 完全一致式の型付き経路を保ち、埋め込み置換ではエスケープ表記と本物の変数式を1回の走査で処理する。置換後に再評価しない。

### 関数・型の変更一覧

#### 既存関数 `fill`

**引数・戻り値**

```text
fill(value: unknown, context: FillContext): unknown
```

**方針**

- `fill` の完全一致式は型を返す現行経路を維持する。
- 埋め込み文字列の置換ではエスケープの分岐を追加する。

#### 既存型の直接変更なし

**方針**

- `FillContext` と `ExpandResult` に変更は不要。公開の文書形式は文字列のまま使う。

#### 新規関数 `fillText`

**引数・戻り値**

```text
fillText(text: string, resolve: (head: string, path: string) => string): string
```

**方針**

- `fillText(text, resolve)` はエスケープ記号と変数式を一度の置換で処理し、置換後に再評価しない。

#### 新規型なし

**方針**

- 新規型は不要。変数の解決は既存 lookup と文字列への変換を使う。

**処理・互換性の補足** fill の完全一致と埋め込み置換の両方で、エスケープされた開始記号を置換対象から除外する。同一の走査で判別して、保護した記号を最終文字列へ復元する。

**変更コード案**

```ts
// src/builder/expand.ts
const expressionStart = '$' + '{';
function fillText(text: string, resolve: (head: string, path: string) => string): string {
    return text.replace(
        /\$\$\{|\$\{([A-Za-z_][A-Za-z0-9_]*)((?:\.[A-Za-z0-9_$]+)*)\}/g,
        (match, head: string | undefined, path: string | undefined) =>
            head === undefined ? expressionStart : resolve(head, path ?? ''),
    );
}
// 既存 WHOLE_VARIABLE で値型を保つ経路を残し、文字列埋め込みに適用する。
```

**確認ケース** リテラルだけ、実変数だけ、同一文字列での混在、存在しない変数で診断と文字列を確認する。

<a id="implementation-detail-136"></a>

## 136. ページの入れ子

**解決したい問題** クラス詳細の下にメソッド別ページを置き、メソッドから直前の親へ戻りたい。

**現行コード** splitPages は moved に入った入れ子ページを警告して親へ残す。resolveReport の parent.href は各詳細ページを同じ目次へ結ぶ。

**主な修正先** [`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)

**コード修正案** 要素木のページ境界を事前割当し、親の子ページ位置を PageLink へ差し替える。SplitPage に親のファイル情報を通し、双方の href は相対URLで計算する。

### 関数・型の変更一覧

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `splitPages` は階層に沿ってページ境界を割り当て、子ページを PageLink へ置き換える。

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- `resolveReport` は各ページの parent.href を生成元からの相対URLにする。

#### 既存型 `SplitPage`

**属性・型**

```text
SplitPage { parentFile: string; children: readonly string[] }
```

**方針**

- parentFile で直近の親、children で直下の子を保持する。ページの相対リンク生成はそれぞれのファイル名が確定してから行う。

#### 既存型 `EmbeddedReport`

**属性・型**

```text
EmbeddedReport { parent?: { title: string; href: string } }
```

**方針**

- `EmbeddedReport.parent` の形を保ち、値の生成元を直近の親ページへ変更する。

#### 新規関数 `relativeReportHref`

**引数・戻り値**

```text
relativeReportHref(fromFile: string, toFile: string): string
```

**方針**

- `relativeReportHref(fromFile, toFile)` が POSIX 相対URLを求める。
- 境界の列挙はファイル名の割当と要素切出しより先に行う。

#### 新規型なし

**方針**

- `NestedSplitPage` は差分を説明する合成型。実装では既存 `SplitPage` を直接拡張する。

**処理・互換性の補足** 親ページと子ページを切り出す前に要素の階層を確定する。親の spec では子を PageLink に置換し、子の parent.href は直近の親ファイルから計算する。各ページは自分の state だけを選ぶ。

**変更コード案**

```ts
// src/builder/pages.ts + reportBuilder.ts
type NestedSplitPage = SplitPage & { parentFile: string; children: readonly string[] };
function relativeReportHref(fromFile: string, toFile: string): string {
    return path.posix.relative(path.posix.dirname(fromFile), toFile);
}
// 親→子は PageLink の href、子→親は EmbeddedReport.parent.href に相対URLを使う。
// 先にすべてのファイル名を割り当て、あとでツリーをページに切り出す。
```

**確認ケース** クラス→メソッド→目次の往復と、同じ深さに複数の子がある場合の表示を確認する。

<a id="implementation-detail-137"></a>

## 137. ページのファイル名

**解決したい問題** Account と account、または同じ表示名の別種別をWindowsで生成してもファイルを上書きしないようにする。

**現行コード** fileNameOf で無効文字を置換し、splitPages は files.has(base) で重複を見ている。文字ケースが異なれば同一パスとみなされない。

**主な修正先** [`src/builder/pages.ts`](../../src/builder/pages.ts)、[`test/report/report-builder.test.ts`](../../test/report/report-builder.test.ts)

**コード修正案** ファイル名の予約キーを正規化し、大小文字を区別しない比較へ切り替える。競合時は論理ID由来の短い接尾辞を使い、予約時に再確認する。

### 関数・型の変更一覧

#### 既存関数 `fileNameOf`

**引数・戻り値**

```text
fileNameOf(name: string): string
```

**方針**

- `fileNameOf` と `splitPages` の連続番号割当を、大小文字を揃えたパス予約へ変更する。
- 一意な従来名は維持する。

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `fileNameOf` と `splitPages` の連続番号割当を、大小文字を揃えたパス予約へ変更する。

#### 既存型の直接変更なし

**方針**

- `SplitPage.file` は引き続き文字列の相対パス。文書と埋め込み型の追加は不要。

#### 新規関数 `reservePageFile`

**引数・戻り値**

```text
reservePageFile(base: string, stableSuffix: string): string
```

**方針**

- `reservePageFile(base, stableSuffix)` は比較用キーで衝突を確認し、必要な場合だけ接尾辞を付ける。
- 予約集合はビルド内に閉じる。

#### 新規型なし

**方針**

- 新規公開型は不要。予約の内部状態は `Set<string>` で表す。

**処理・互換性の補足** 現在の fileNameOf で候補を正規化した後、拡張子込みのパスを大小文字を揃えて予約する。衝突時は種別と安定IDに由来する接尾辞を使い、一意だった既存名は維持する。

**変更コード案**

```ts
// src/builder/pages.ts
const reservedPagePaths = new Set<string>();
function reservePageFile(base: string, stableSuffix: string): string {
    let stem = base;
    let counter = 1;
    while (reservedPagePaths.has((stem + '.html').toLowerCase())) {
        stem = base + '_' + stableSuffix + (counter === 1 ? '' : '_' + String(counter));
        counter++;
    }
    reservedPagePaths.add((stem + '.html').toLowerCase());
    return 'pages/' + stem + '.html';
}
// Set は splitPages 一回分に閉じ、候補の処理順と接尾辞を安定化する。
```

**確認ケース** 同名異種別、大文字小文字だけの差、記号正規化後の衝突、長い入力で上書きがないことを確認する。

<a id="implementation-detail-138"></a>

## 138. 部分の使い回し

**解決したい問題** 同一の「メソッド呼び出し表」をタイトルや対象だけ変えて複数のページに置きたい。

**現行コード** normalizeReportDocument はデータ宣言等を正規化し、expandReportDocument は spec の要素・for/if を展開する。パラメーター付き部分を参照する要素の型がない。

**主な修正先** [`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`src/report/shorthand.ts`](../../src/report/shorthand.ts)

**コード修正案** 部品定義と use のスキーマを足し、with を現在スコープで評価した後に部品スコープへ渡す。利用箇所キーを使って子のIDと参照を書き換え、循環を診断する。

### 関数・型の変更一覧

#### 既存関数 `normalizeReportDocument`

**引数・戻り値**

```text
normalizeReportDocument(document: ReportDocument): NormalizedReportDocument
```

**方針**

- `normalizeReportDocument` は部品定義を整え、`expandReportDocument` の要素展開が use と with を評価する。
- 名前に利用元の接頭辞を付けて子参照も書き換える。

#### 既存関数 `expandReportDocument`

**引数・戻り値**

```text
expandReportDocument(document: ReportDocument, run: SourceRunner, params?: Record<string, unknown>): ExpandResult
```

**方針**

- `normalizeReportDocument` は部品定義を整え、`expandReportDocument` の要素展開が use と with を評価する。

#### 既存型 `ReportDocument`

**属性・型**

```text
ReportDocument {
    fragments?: Record<string, ReportFragment>;
    spec: Omit<Spec, 'elements'> & {
        elements: Record<string, Spec['elements'][string] | FragmentUse>;
    };
}
```

**方針**

- `ReportDocument` に任意の定義集合と use 要素を追加する。
- 既存の `Spec` は部品展開後の通常要素に正規化する。

#### 新規関数 `scopeForUse`

**引数・戻り値**

```text
scopeForUse(scope: Scope, args: Record<string, unknown>): Scope
```

**方針**

- `scopeForUse(scope, args)` は局所スコープを構成する。

#### 新規関数 `expandFragment`

**引数・戻り値**

```text
expandFragment(use: FragmentUse, scope: Scope, stack: readonly string[]): Spec['elements']
```

**方針**

- `expandFragment(use, scope, stack)` は循環と不足引数を検査して要素列を生成する。

#### 新規型 `ReportFragment`

**属性・型**

```text
ReportFragment { params?: readonly string[]; root: string; elements: ReportDocument['spec']['elements'] }
```

**方針**

- `ReportFragment` は引数、root、elements。

#### 新規型 `FragmentUse`

**属性・型**

```text
FragmentUse { use: string; with?: Record<string, unknown> }
```

**方針**

- `FragmentUse` は部品名と任意の入力値を持つ。

**処理・互換性の補足** 文書の定義側と use の参照側を分離し、with は展開時の局所スコープに入れる。展開した要素キーには利用箇所ごとの接頭辞を付け、呼出しスタックで循環を検出する。

**変更コード案**

```ts
// src/report/document.ts + src/builder/expand.ts
type ReportFragment = {
    params?: readonly string[];
    root: string;
    elements: ReportDocument['spec']['elements'];
};
type FragmentUse = { use: string; with?: Record<string, unknown> };
function scopeForUse(scope: Scope, args: Record<string, unknown>): Scope {
    return { ...scope, fragment: { row: args, index: 0 } };
}
// use 展開時は利用箇所の接頭辞で要素IDを振り直し、スタック中の fragment ID は循環とする。
```

**確認ケース** 同じ部分の複数利用、変数のシャドーイング、不足引数、直接・間接循環を確認する。

<a id="implementation-detail-139"></a>

## 139. YAML でも書ける

**解決したい問題** JSON と同じ文書を comments や複数行の説明を含む YAML でも渡したい。

**現行コード** CLIのファイル経路はJSONを読み、MCPのドキュメント引数は構造化値を受ける。パースと共通の文書検証に境界がある。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/cli/index.ts`](../../src/cli/index.ts)、[`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)、[`package.json`](../../package.json)

**新規パス候補** `src/report/readDocument.ts`

**コード修正案** ファイル入力だけを拡張子で振り分け、パース結果を既存 expandShorthand とZodへ渡す。MCPの構造化引数は同じ正規化結果になることを確認する。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` のファイル読み込みとMCPのファイル指定経路を共通の文書パースへつなぐ。
- 構造化済みMCP入力は既存の検証を通す。

#### 既存関数 `registerReportTools`

**引数・戻り値**

```text
registerReportTools(server: McpServer, source: ProcessorSource, options?: ReportToolOptions): void
```

**方針**

- 構造化済みMCP入力は既存の検証を通す。

#### 既存型の直接変更なし

**方針**

- `ReportDocument` の形は維持する。`ReportIssue` は既存の path と message を使い、位置拡張は151と共有できる。

#### 新規関数 `parseDocumentText`

**引数・戻り値**

```text
parseDocumentText(file: string, text: string): DocumentRead
```

**方針**

- `parseDocumentText(file, text)` は拡張子別に解析して Zod で検証し、`readReportDocument(file)` がファイル読み込みから呼ぶ。

#### 新規関数 `readReportDocument`

**引数・戻り値**

```text
readReportDocument(file: string): Promise<DocumentRead>
```

**方針**

- `parseDocumentText(file, text)` は拡張子別に解析して Zod で検証し、`readReportDocument(file)` がファイル読み込みから呼ぶ。

#### 新規型 `DocumentRead`

**属性・型**

```text
DocumentRead = { ok: true; document: ReportDocument } | { ok: false; issues: ReportIssue[] }
```

**方針**

- `DocumentRead` は ok/document と ok/issues を区別する結果型。

**処理・互換性の補足** 文書ファイルの拡張子でJSON/YAMLを選び、結果を同じ正規化・Zod検証へ渡す。MCPがすでに構造化JSONを受け取る経路は共通の検証を使う。パース失敗とスキーマエラーの場所を報告する。

**変更コード案**

```ts
// src/report/readDocument.ts
type DocumentRead =
    | { ok: true; document: ReportDocument }
    | { ok: false; issues: ReportIssue[] };
function parseDocumentText(file: string, text: string): DocumentRead {
    try {
        const extension = path.extname(file).toLowerCase();
        const raw = extension === '.yaml' || extension === '.yml' ? parseYaml(text) : parseJsonFile(file, text);
        const parsed = ReportDocument.safeParse(expandShorthand(raw));
        return parsed.success ? { ok: true, document: parsed.data } : { ok: false, issues: zodIssues(parsed.error) };
    } catch (error) {
        return { ok: false, issues: [documentReadIssue(file, error)] };
    }
}
```

**確認ケース** 同内容のJSON/YAML、壊れた構文、未対応拡張子、構造化MCP入力を確認する。

<a id="implementation-detail-140"></a>

## 140. 文書の形の版

**解決したい問題** 将来スキーマの意味が変わっても、既存の版なし文書と新しい版の文書を明示的に判別したい。

**現行コード** ReportDocument に構文バージョンはない。JSON Schema の生成と雛形の定義には現行版を表すフィールドがない。

**主な修正先** [`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`src/report/templates.ts`](../../src/report/templates.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`docs/catalog/generate.ts`](../../docs/catalog/generate.ts)

**コード修正案** 版の定数とバリデーションを追加する。版なしは現行互換として正規化し、未対応の値は展開前に version の診断として返す。

### 関数・型の変更一覧

#### 既存関数 `normalizeReportDocument`

**引数・戻り値**

```text
normalizeReportDocument(document: ReportDocument): NormalizedReportDocument
```

**方針**

- `normalizeReportDocument` は省略時の版を確定する。

#### 既存関数 `buildDocumentJsonSchema`

**引数・戻り値**

```text
buildDocumentJsonSchema(): JsonSchema
```

**方針**

- `buildDocumentJsonSchema` と雛形生成に同じ版定数を使う。

#### 既存型 `ReportDocument`

**属性・型**

```text
ReportDocument { version?: ReportVersion }
```

**方針**

- `ReportDocument` に任意の version を追加し、正規化後は実効版が存在する形にできる。
- 未知版は展開前にエラーとする。

#### 新規関数 `effectiveReportVersion`

**引数・戻り値**

```text
effectiveReportVersion(document: { version?: 1 }): 1
```

**方針**

- `effectiveReportVersion(document)` が既定版を返す。
- 将来の版変換は実際に版が増える段階で追加する。

#### 新規型 `ReportVersion`

**属性・型**

```text
ReportVersion = 1
```

**方針**

- `ReportVersion` は現行の literal 1 を定義するZodスキーマ。
- 今は版ごとの別文書型を追加しない。

**処理・互換性の補足** version が省略された既存文書は現行版の規則で解釈し、明示した版から処理を選ぶ。スキーマ生成と雛形は同じ現行版定数を参照する。未知の版は展開前に診断する。

**変更コード案**

```ts
// src/report/document.ts + documentSchema.ts
const CURRENT_REPORT_VERSION = 1;
const ReportVersion = z.literal(CURRENT_REPORT_VERSION).optional();
function effectiveReportVersion(document: { version?: 1 }): 1 {
    return document.version ?? CURRENT_REPORT_VERSION;
}
// ReportDocument に version: ReportVersion を追加し、生成雛形は版を明示する。
// 版の検証は expandShorthand 後、展開前に行う。
```

**確認ケース** 版なし、現行版、未知版での扱いと、生成雛形が生成スキーマを通ることを確認する。

<a id="implementation-detail-144"></a>

## 144. notes のキーの一覧を出す

**解決したい問題** クラスのメソッド数に応じて生成される notes キーについて、入力済みと欠落を把握したい。

```json
{
    "required": ["AccountService.remove(Id)"],
    "present": ["AccountService.find(Id)"],
    "unused": ["OldAccountService.load()"]
}
```

**現行コード** expand.ts の contextOf の note はキーごとに検索・警告をするが、参照された全キーを呼出側に返さない。

**主な修正先** [`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/cli/index.ts`](../../src/cli/index.ts)、[`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)

**新規パス候補** `src/builder/notes.ts`

**コード修正案** 展開中に note の実キーを Set に記録する。ExpandResult から共通集計へ渡して必要・入力済み・未使用を返し、通常ビルドと専用CLI/MCPで実際の展開条件を共用する。

### 関数・型の変更一覧

#### 既存関数 `expandReportDocument`

**引数・戻り値**

```text
expandReportDocument(document: ReportDocument, run: SourceRunner, params?: Record<string, unknown>): ExpandResult
```

**方針**

- 通常のノート解決時に参照キーを収集し、展開されなかった分岐のキーは収集対象から外す。展開不要の早期returnでも noteKeys を空配列で返す。

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- 専用集計からも通常ビルドと同じ provider、比較時点、params で文書を展開できる入口を共有する。

#### 既存型 `ExpandResult`

**属性・型**

```text
ExpandResult { noteKeys: string[] }
```

**方針**

- 実際に展開した注記のキーを noteKeys に追加する。早期returnと通常returnで同じ形を返す。

#### 新規関数 `noteFor`

**引数・戻り値**

```text
noteFor(name: string, elementKey: string): string
```

**方針**

- 最初に参照キーを集合へ記録する。その後に本文を検索し、欠落時は従来どおり要素パスの診断と未記入表示を返す。

#### 新規関数 `listNoteKeys`

**引数・戻り値**

```text
listNoteKeys(referenced: ReadonlySet<string>, notes: Readonly<Record<string, string>>): NoteKeyReport
```

**方針**

- 参照したキーのうち定義のないものを required、定義済みを present、参照されなかった定義を unused に入れる。各配列を安定順で返す。

#### 新規型 `NoteKeyReport`

**属性・型**

```text
NoteKeyReport { required: string[]; present: string[]; unused: string[] }
```

**方針**

- required・present・unused を別々の文字列配列にし、CLIとMCPで同じ契約を使う。

**処理・互換性の補足** fill が $note を解決する際に展開後のキーを収集する。listNoteKeys は実際に参照したキーと定義キーから必要、入力済み、未使用を計算し、CLI と MCP は同じ文書展開条件を使う。

**変更コード案**

```ts
// src/builder/notes.ts + expand.ts
type NoteKeyReport = {
    required: string[];
    present: string[];
    unused: string[];
};
function listNoteKeys(referenced: ReadonlySet<string>, notes: Readonly<Record<string, string>>): NoteKeyReport {
    const ordered = [...referenced].sort();
    return {
        required: ordered.filter((key) => !Object.hasOwn(notes, key)),
        present: ordered.filter((key) => Object.hasOwn(notes, key)),
        unused: Object.keys(notes).filter((key) => !referenced.has(key)).sort(),
    };
}
// ExpandResult に noteKeys を持たせ、contextOf の note() で referenced を収集する。
```

**適用箇所のコード案**

```ts
// expandReportDocument で、既存 note() の先頭に収集行を追加
const referencedNoteKeys = new Set<string>();
const noteFor = (name: string, elementKey: string): string => {
    referencedNoteKeys.add(name);
    const notes = document.notes ?? {};
    if (Object.hasOwn(notes, name)) return notes[name]!;
    warnings.push({
        path: 'spec.' + elementKey + '.props',
        message: 'No note for "' + name + '".',
    });
    return '(未記入: ' + name + ')';
};
// needsExpansion が偽の早期 return では noteKeys: [] を返す。
// 通常の return では noteKeys: [...referencedNoteKeys] を渡す。
// 収集専用の CLI/MCP も resolveReport と同じ provider・比較・params を使って展開する。
```

**確認ケース** forで生成されたキー、条件で除外された項目、同一キーの複数利用、余分な定義で一覧を確認する。

<a id="implementation-detail-145"></a>

## 145. notes を別のファイルに置く

**解決したい問題** Markdown の説明をレポート構成ファイルから分け、同じ notes をバージョン管理したい。

**現行コード** 文書の notes はキー→文字列として展開器に渡る。外部ファイルと相対パスを解決する段階がない。

**主な修正先** [`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/expand.ts`](../../src/builder/expand.ts)

**新規パス候補** `src/builder/notes.ts`

**コード修正案** CLI/MCPの読取境界で notesSources を解決し、形式別に文字列マップへ変換する。文書位置の取得可否を区別し、展開には統合後の値だけを渡す。

### 関数・型の変更一覧

#### 既存関数 `runCli`

**引数・戻り値**

```text
runCli(argv: string[], io: CliIo): Promise<number>
```

**方針**

- `runCli` とMCPの文書読込段階でファイルを解決し、`expandReportDocument` には統合済みnotesを渡す。

#### 既存関数 `expandReportDocument`

**引数・戻り値**

```text
expandReportDocument(document: ReportDocument, run: SourceRunner, params?: Record<string, unknown>): ExpandResult
```

**方針**

- `runCli` とMCPの文書読込段階でファイルを解決し、`expandReportDocument` には統合済みnotesを渡す。

#### 既存型 `ReportDocument`

**属性・型**

```text
ReportDocument { notes?: Record<string, string>; notesSources?: NotesSource[] }
```

**方針**

- `ReportDocument` に任意の外部notes参照を加える。
- 展開後の `notes` は既存のキー→文字列に揃える。

#### 新規関数 `resolveNotes`

**引数・戻り値**

```text
resolveNotes(documentPath: string, sources: readonly NotesSource[], inline: Record<string, string>): Promise<Record<string, string>>
```

**方針**

- `resolveNotes(documentPath, sources, inline)` は外部ファイルと文書内の値を優先順で合成する。

#### 新規関数 `readNoteFile`

**引数・戻り値**

```text
readNoteFile(file: string, format?: NotesSource['format']): Promise<Record<string, string>>
```

**方針**

- `readNoteFile(file, format)` はJSON/Markdownを同じマップにする。

#### 新規型 `NotesSource`

**属性・型**

```text
NotesSource { file: string; format?: 'json' | 'markdown' }
```

**方針**

- `NotesSource` は相対ファイルパスと任意の形式。
- 未対応・欠落等は既存診断型へ写す。

**処理・互換性の補足** 文書の置き場所を基準にファイル指定を解決し、JSONとMarkdownをキー→文章へ変換する。重複時は文書内定義が優先する案とし、MCPで基準パスを取得できない場合は明示的に診断する。

**変更コード案**

```ts
// src/builder/notes.ts
type NotesSource = { file: string; format?: 'json' | 'markdown' };
async function resolveNotes(
    documentPath: string,
    sources: readonly NotesSource[],
    inline: Record<string, string>,
) {
    const base = path.dirname(documentPath);
    const external = await Promise.all(sources.map((source) =>
        readNoteFile(path.resolve(base, source.file), source.format)
    ));
    return Object.assign(Object.create(null), ...external, inline) as Record<string, string>;
}
// JSON は文字列のマップ、Markdown はキー見出しと本文に変換する。
```

**確認ケース** 複数ファイル、キーの衝突、欠損・構文エラー、別ディレクトリから起動を確認する。

<a id="implementation-detail-146"></a>

## 146. 文章の鮮度

**解決したい問題** 処理フローの実装が変わった後、古い説明文かもしれないことをページで把握したい。

**現行コード** $note は該当キーの現在の文字列を描画する。説明の作成時に使ったデータのバージョンを記録していない。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)

**新規パス候補** `src/builder/notes.ts`

**コード修正案** キーと根拠データの対応を決め、その範囲だけ正規化して指紋を作る。保存時の指紋と比較し、未記録、同一、内容変更を区別する。

### 関数・型の変更一覧

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- `expandReportDocument` または `resolveReport` の注記解決時に現在の指紋を作り、該当キーの保存値と比較する。

#### 既存型 `ReportDocument`

**属性・型**

```text
ReportDocument { noteFingerprints?: Record<string, NoteFingerprint> }
```

**方針**

- `ReportDocument` の notes 本文の型は維持する。
- 指紋の表または外部notesのメタデータに任意の保存値を持たせる。

#### 新規関数 `fingerprintNoteData`

**引数・戻り値**

```text
fingerprintNoteData(value: unknown): NoteFingerprint
```

**方針**

- `fingerprintNoteData(value)` が正規化データを SHA-256 にし、`freshness(saved, current)` が unknown/current/stale を判定する。

#### 新規関数 `freshness`

**引数・戻り値**

```text
freshness(saved: NoteFingerprint | undefined, current: NoteFingerprint): NoteFreshness
```

**方針**

- `fingerprintNoteData(value)` が正規化データを SHA-256 にし、`freshness(saved, current)` が unknown/current/stale を判定する。

#### 新規型 `NoteFingerprint`

**属性・型**

```text
NoteFingerprint { algorithm: 'sha256'; value: string }
```

**方針**

- `NoteFingerprint` は algorithm と value、`NoteFreshness` は比較結果の3状態。

#### 新規型 `NoteFreshness`

**属性・型**

```text
NoteFreshness = 'unknown' | 'current' | 'stale'
```

**方針**

- `NoteFingerprint` は algorithm と value、`NoteFreshness` は比較結果の3状態。

**処理・互換性の補足** notesキーに対応する行やデータ集合だけを決定的に直列化し、指紋を保存する。現在値と保存値を照合し、未記録・一致・不一致を別の状態として扱う。

**変更コード案**

```ts
// src/builder/notes.ts
type NoteFingerprint = { algorithm: 'sha256'; value: string };
type NoteFreshness = 'unknown' | 'current' | 'stale';
function freshness(saved: NoteFingerprint | undefined, current: NoteFingerprint): NoteFreshness {
    if (!saved) return 'unknown';
    return saved.algorithm === current.algorithm && saved.value === current.value ? 'current' : 'stale';
}
// createHash に対象の正規化済みデータを渡し、キーごとの指紋として保持する。
```

**確認ケース** 対象外の行だけ変わった場合、同内容で順序だけ変わった場合、対象データが変わった場合を確認する。

<a id="implementation-detail-147"></a>

## 147. AI の注記

**解決したい問題** 自動生成された注記を、元の表やソースを上書きせず該当カードに表示したい。

**現行コード** 文書には notes の仕組みがあるが、対象の安定IDと注記の出所を別フィールドで保持するモデルがない。

**主な修正先** [`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)

**新規パス候補** `src/viewer/report/components/annotations.tsx`

**コード修正案** annotation を ID、対象、本文、出所の型として追加する。分割ページへ対象IDで配分し、本文の既存データと分けて表示する。

### 関数・型の変更一覧

#### 既存関数 `expandReportDocument`

**引数・戻り値**

```text
expandReportDocument(document: ReportDocument, run: SourceRunner, params?: Record<string, unknown>): ExpandResult
```

**方針**

- `expandReportDocument` は注記の対象IDを展開結果に通し、`splitPages` が対象を含むページへ割り当てる。
- viewer registry が部品を描画する。

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `expandReportDocument` は注記の対象IDを展開結果に通し、`splitPages` が対象を含むページへ割り当てる。

#### 既存型 `ReportDocument`

**属性・型**

```text
ReportDocument { annotations?: ReportAnnotation[] }
```

**方針**

- `ReportDocument` と `EmbeddedReport` の該当部分に任意の annotations を加える。
- 既存notes本文やprovider行の値は維持する。

#### 既存型 `EmbeddedReport`

**属性・型**

```text
EmbeddedReport { annotations?: ReportAnnotation[] }
```

**方針**

- `ReportDocument` と `EmbeddedReport` の該当部分に任意の annotations を加える。

#### 新規関数 `annotationsForTarget`

**引数・戻り値**

```text
annotationsForTarget(annotations: readonly ReportAnnotation[], targetId: string): ReportAnnotation[]
```

**方針**

- `annotationsForTarget(annotations, targetId)` は対象の注記を抽出する。
- viewer部品は注記本文、対象、出所を表示する。

#### 新規型 `ReportAnnotation`

**属性・型**

```text
ReportAnnotation { id: string; targetId: string; text: string; origin: 'ai' }
```

**方針**

- `ReportAnnotation` は id、targetId、text、origin を定義するZodスキーマ。

**処理・互換性の補足** 注記は本文と対象IDを持つ任意データとして展開結果に渡す。対象が別ページなら対象ページの state へ割り振り、参照できないIDは診断に残す。

**変更コード案**

```ts
// src/report/document.ts + src/viewer/report/components/annotations.tsx
const ReportAnnotation = z.object({
    id: z.string().min(1),
    targetId: z.string().min(1),
    text: z.string(),
    origin: z.literal('ai'),
});
function annotationsForTarget(
    annotations: readonly z.infer<typeof ReportAnnotation>[],
    targetId: string,
) {
    return annotations.filter((annotation) => annotation.targetId === targetId);
}
```

**確認ケース** 目次と詳細ページに対象がある例、複数注記、対象が削除された場合を確認する。

<a id="implementation-detail-151"></a>

## 151. 日本語にする

**解決したい問題** 存在しない provider を書いたとき、日本語でどの宣言を直せばよいか確認したい。

**現行コード** ReportIssue は path と message の組で、sourceRunner、Zod、expand でメッセージを個別に生成する。翻訳用のコードや設定がない。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/expand.ts`](../../src/builder/expand.ts)、[`src/builder/sources.ts`](../../src/builder/sources.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`src/cli/index.ts`](../../src/cli/index.ts)、[`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)

**新規パス候補** `src/report/diagnostics.ts`

**コード修正案** 重要な診断からコードと引数を導入し、元のフィールドパスは維持する。CLIとMCP出力前に言語を選び、行・列が取れるファイル入力では位置も付ける。

### 関数・型の変更一覧

#### 既存関数 `runSource`

**引数・戻り値**

```text
runSource(source: ReportDataSource, path: string, input: ReportInput, options: ResolveReportOptions, issues: ReportIssue[]): SourceResult | undefined
```

**方針**

- `runSource`／`expandReportDocument` 等で代表的な診断にコードと引数を付ける。
- CLI/MCP の出力境界で表示言語を選ぶ。

#### 既存関数 `expandReportDocument`

**引数・戻り値**

```text
expandReportDocument(document: ReportDocument, run: SourceRunner, params?: Record<string, unknown>): ExpandResult
```

**方針**

- `runSource`／`expandReportDocument` 等で代表的な診断にコードと引数を付ける。

#### 既存型 `ReportIssue`

**属性・型**

```text
ReportIssue { path: string; message: string; code?: ReportDiagnosticCode; params?: Readonly<Record<string, string | number>>; position?: { line: number; column: number } }
```

**方針**

- `ReportIssue` に任意の code、params、position を足す。
- `path` と `message` は旧来の診断や未翻訳のフォールバックとして維持する。

#### 新規関数 `renderIssue`

**引数・戻り値**

```text
renderIssue(issue: ReportIssue, locale: ReportLocale): ReportIssue
```

**方針**

- `renderIssue(issue, locale)` はコード・引数から翻訳済みメッセージを組み立てる。
- ファイル位置はパーサーから取得可能な場合に付ける。

#### 新規型 `ReportLocale`

**属性・型**

```text
ReportLocale = 'ja' | 'en'
```

**方針**

- `ReportLocale` は ja/en。
- `ReportDiagnostic` は拡張項目の説明用で、実装では `ReportIssue` へ統合できる。

#### 新規型 `ReportDiagnosticCode`

**属性・型**

```text
ReportDiagnosticCode = 'unknownProvider' | 'invalidArgument' | 'unknownNote' | 'missingRows'
```

**方針**

- `ReportDiagnostic` は拡張項目の説明用で、実装では `ReportIssue` へ統合できる。

**処理・互換性の補足** ReportIssue に code、path、置換値を追加し、既存messageは移行中のフォールバックに使う。入力テキストに位置情報がある経路では行・列を付け、CLIとMCPは表示時に言語を選ぶ。

**変更コード案**

```ts
// src/report/diagnostics.ts
type ReportLocale = 'ja' | 'en';
type ReportDiagnostic = ReportIssue & {
    code?: 'unknownProvider' | 'invalidArgument' | 'unknownNote' | 'missingRows';
    params?: Readonly<Record<string, string | number>>;
    position?: { line: number; column: number };
};
function renderIssue(issue: ReportDiagnostic, locale: ReportLocale): ReportIssue {
    const template = issue.code ? messageTemplates[locale][issue.code] : undefined;
    return { ...issue, message: template?.(issue.params ?? {}) ?? issue.message };
}
```

**確認ケース** 未知provider、引数・スキーマエラー、forで生成されたパスを日英両方で確認する。
