# 3. 部品と viewer（`src/report/catalog.ts`・`src/viewer`）の実装詳細

[実装タスク別の変更先と実装方針](../implementation-task-paths.md) ・ [元の実装タスク一覧](../implementation-tasks.md)

「現行コード」は調査時点の実装に基づきます。「コード修正案」とコードブロックは変更後の案です。省略したヘルパーと型は、記載のファイルに組み込むときに実装または既存処理へ接続します。確認ケースは実装後に検証する内容です。

各項目の「関数・型の変更一覧」では、定義名ごとに変更後のシグネチャまたは型の関係する属性と、その定義の実装方針を示します。追加候補の名前は計画上の名前です。

<a id="implementation-detail-87"></a>

## 87. 並べ替えと列の出し分け

**解決したい問題** 金額の列を10より2が先になる数値順で並べて、見たい列だけにしてレビューしたい。

**現行コード** RowsTable は columnsOf で列を選び、検索した filtered をそのまま PAGE_SIZE で切る。列の設定と表が持つ表示状態が分かれていない。

**主な修正先** [`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/viewer/report/components/rowsTable.tsx`](../../src/viewer/report/components/rowsTable.tsx)、[`src/report/catalog.ts`](../../src/report/catalog.ts)

**コード修正案** 列の全体集合と非表示キーを分離する。filtered の後に安定ソートを挟み、最後にページを切る。列ヘッダーの操作は方向と aria-sort を更新し、切り替え時はページ位置を戻す。

### 関数・型の変更一覧

#### 既存関数 `RowsTable`

**引数・戻り値**

```text
RowsTable(props: { rows: Row[]; columns?: Column[] | null; caption?: string | null; showSource?: boolean | null }): ReactElement
```

**方針**

- 既存の検索結果を orderTableRows へ渡した後でページを切る。ヘッダー操作で昇降順と aria-sort を更新し、列の変更時にはページ位置を戻す。

#### 既存型の直接変更なし

**方針**

- `Row`／`Column` と公開propsは維持する。ソートと非表示は部品の内部状態に置く。

#### 新規関数 `orderTableRows`

**引数・戻り値**

```text
orderTableRows(rows: readonly Row[], sort: Sort): Row[]
```

**方針**

- `orderTableRows(rows, sort)` は数値／文字列を比較し、欠損を末尾へ置く。
- 元の行配列は変更しない。

#### 新規型 `Sort`

**属性・型**

```text
Sort { key: string; direction: 'asc' | 'desc' }
```

**方針**

- `Sort` は列キーと asc/desc。
- 非表示キーは `ReadonlySet<string>` で表す。

**処理・互換性の補足** RowsTable で元の行列は変更せず、フィルター、ソート、ページングの順で表示行を導く。比較は数値、文字列、欠損値の方針を決め、同値は元の順序を維持する。列選択は安定した列キーで管理する。

**変更コード案**

```tsx
// src/viewer/report/components/rowsTable.tsx の RowsTable 内
type Sort = { key: string; direction: 'asc' | 'desc' };
const [sort, setSort] = useState<Sort>();
const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(() => new Set());
const shown = (columns ?? columnsOf(rows)).filter(({ key }) => !hiddenKeys.has(key));
// 既存の検索から得た filtered を、ページングの前に並べ替える。
const ordered = sort ? orderTableRows(filtered, sort) : filtered;
const pages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
const current = Math.min(page, pages - 1);
const visible = ordered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
// orderTableRows は数値比較、文字列比較、欠損値の位置を分け、同値の順序を維持する。
```

**適用箇所のコード案**

```ts
// rowsTable.tsx のソート関数
const collator = new Intl.Collator('ja', { numeric: true });
function orderTableRows(rows: readonly Row[], sort: Sort): Row[] {
    return [...rows].sort((left, right) => {
        const a = left[sort.key];
        const b = right[sort.key];
        if (a == null) return b == null ? 0 : 1;
        if (b == null) return -1;
        const order = typeof a === 'number' && typeof b === 'number'
            ? a - b
            : collator.compare(cellText(a), cellText(b));
        return sort.direction === 'asc' ? order : -order;
    });
}
```

**確認ケース** フィルター後の複数ページ、数値の2と10、欠損値、列の非表示と復元を確認する。

<a id="implementation-detail-88"></a>

## 88. CSV / Excel への書き出し

**解決したい問題** 数百行の検索結果を、非表示列を除外したままExcelへ渡したい。

**現行コード** RowsTable の cellText は画面表示用。現在の行リストをCSVやExcelのセルへ型を保って変換する入口がない。

**主な修正先** [`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/viewer/report/components/rowsTable.tsx`](../../src/viewer/report/components/rowsTable.tsx)、[`package.json`](../../package.json)

**新規パス候補** `src/report/export/table.ts`

**コード修正案** 列順とソート・フィルター結果から ExportTable を作り、全対象行を渡す。CSVでは適切に引用し、Excelでは文字列を数式に変換せず、数値と論理値の型を維持する。

### 関数・型の変更一覧

#### 既存関数 `RowsTable`

**引数・戻り値**

```text
RowsTable(props: { rows: Row[]; columns?: Column[] | null; caption?: string | null; showSource?: boolean | null }): ReactElement
```

**方針**

- `RowsTable` にCSV/Excel出力をつなぎ、ソート・検索後の全行と表示列を渡す。
- `cellText` は画面向けとして維持する。

#### 既存型の直接変更なし

**方針**

- `RowsTable` の既存propsを変更する必要はない。行と列の形は `Row`／`Column` を再利用する。

#### 新規関数 `tableForExport`

**引数・戻り値**

```text
tableForExport(columns: readonly Column[], rows: readonly Row[]): ExportTable
```

**方針**

- `tableForExport(columns, rows)` は型付き表へ変換する。

#### 新規関数 `csvCell`

**引数・戻り値**

```text
csvCell(cell: ExportCell): string
```

**方針**

- `csvCell(cell)` と `encodeCsv(table)` は引用と文字列化、`encodeExcel(table)` はワークブック出力を担当する。

#### 新規関数 `encodeCsv`

**引数・戻り値**

```text
encodeCsv(table: ExportTable): string
```

**方針**

- `csvCell(cell)` と `encodeCsv(table)` は引用と文字列化、`encodeExcel(table)` はワークブック出力を担当する。

#### 新規関数 `encodeExcel`

**引数・戻り値**

```text
encodeExcel(table: ExportTable): Promise<Uint8Array>
```

**方針**

- `csvCell(cell)` と `encodeCsv(table)` は引用と文字列化、`encodeExcel(table)` はワークブック出力を担当する。

#### 新規型 `ExportCell`

**属性・型**

```text
ExportCell = string | number | boolean | null
```

**方針**

- `ExportCell` は string/number/boolean/null、`ExportTable` は列順と正規化済みセル行。
- CLI出力とも共用する。

#### 新規型 `ExportTable`

**属性・型**

```text
ExportTable { columns: readonly Column[]; rows: readonly (readonly ExportCell[])[] }
```

**方針**

- `ExportCell` は string/number/boolean/null、`ExportTable` は列順と正規化済みセル行。

**処理・互換性の補足** 表の正規化処理は表示順の列と行を受け取り、値を型付きセルに変換する。エクスポート範囲はフィルター・ソート後の全行とし、ページングは表示だけに適用する案とする。CSVの改行・引用符と表計算で式として解釈される文字列も扱う。

**変更コード案**

```ts
// src/report/export/table.ts
type ExportCell = string | number | boolean | null;
type ExportTable = { columns: readonly Column[]; rows: readonly (readonly ExportCell[])[] };
function tableForExport(columns: readonly Column[], rows: readonly Row[]): ExportTable {
    return {
        columns,
        rows: rows.map((row) => columns.map(({ key }) => exportCellOf(row[key]))),
    };
}
function csvCell(cell: ExportCell): string {
    const value = String(cell ?? '');
    const text = typeof cell === 'string' && /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
    return '"' + text.replaceAll('"', '""') + '"';
}
// Excel は文字列セルを文字列として書き、数値・真偽値には型を付ける。
```

**確認ケース** 日本語、カンマ、改行、文字列として出す値、複数ページ、列の非表示を含む表でCSVとExcelを確認する。

<a id="implementation-detail-89"></a>

## 89. status のない「変化」の列を出さない

**解決したい問題** 1時点のレイアウト詳細で「変化」の空欄列が幅を取るのを解消したい。

**現行コード** details.tsx の LayoutView、FlexiPageView、AutomationView は表示用の列を個別に組んでいる。比較時だけ使う列を出力行に合わせて選ぶ必要がある。

**主な修正先** [`src/viewer/report/components/details.tsx`](../../src/viewer/report/components/details.tsx)、[`src/viewer/report/components/status.tsx`](../../src/viewer/report/components/status.tsx)、[`src/viewer/report/components/rowsTable.tsx`](../../src/viewer/report/components/rowsTable.tsx)

**コード修正案** status.tsx の isStatus を再利用して、各表に実際に渡す行に状態がある場合だけ列を足す。比較ラベルとは独立に判定する。

### 関数・型の変更一覧

#### 既存関数 `LayoutView`

**引数・戻り値**

```text
LayoutView(props: { data: LayoutDetail[] | undefined }): ReactElement
```

**方針**

- 関連リストとアクションの各行を別々に確認し、それぞれの列定義へ withStatusColumn を適用する。

#### 既存関数 `FlexiPageView`

**引数・戻り値**

```text
FlexiPageView(props: { data: FlexiPageDetail[] | undefined }): ReactElement
```

**方針**

- 表示対象の行ごとに状態列が必要か判定する。比較のタイトルを列表示の条件に使わない。

#### 既存関数 `AutomationView`

**引数・戻り値**

```text
AutomationView(props: { data: AutomationRow[] | undefined }): ReactElement
```

**方針**

- Flow・Apex等に分けられた表の現在の行を使い、状態のある表にだけ「変化」を加える。

#### 既存型の直接変更なし

**方針**

- `Row`／`Status` は維持する。移行用の出力型追加も不要。

#### 新規関数 `withStatusColumn`

**引数・戻り値**

```text
withStatusColumn(rows: readonly Row[], columns: readonly Column[]): Column[]
```

**方針**

- `withStatusColumn(rows, columns)` は有効な status を持つ行がある場合にだけ「変化」を既存位置に挿入する。

#### 新規型なし

**方針**

- 新規型は不要。既存 `Row[]` と `Column[]` で十分。

**処理・互換性の補足** 各詳細ビューが RowsTable に渡す列を組むとき、対象行に有効な status が一件でもあれば状態列を追加する。判定は比較見出しや他の列から独立させる。

**変更コード案**

```ts
// src/viewer/report/components/details.tsx
function withStatusColumn(rows: readonly Row[], columns: readonly Column[]): Column[] {
    const base = columns.filter(({ key }) => key !== 'status');
    if (!rows.some(({ status }) => isStatus(status))) return base;
    return [{ key: 'status', label: '変化' }, ...base];
}
// 各ビューで表の変換後の rows を渡す。ページ全体に共通の判定にはしない。
```

**確認ケース** 単一時点、比較で変更なし、追加と変更が混在、空の表で状態列を確認する。

<a id="implementation-detail-90"></a>

## 90. API 名とラベルの切り替え

**解決したい問題** Account.Name のラベル表示に切り替えて利用部門とレビューし、API名に戻して開発に使いたい。

**現行コード** RowsTable と MatrixView は別のセル書式処理を持つ。ラベルとAPI名が両方あるセルも、切替設定の共通入力を持たない。

**主な修正先** [`src/viewer/report/components/rowsTable.tsx`](../../src/viewer/report/components/rowsTable.tsx)、[`src/viewer/report/components/matrix.tsx`](../../src/viewer/report/components/matrix.tsx)、[`src/report/catalog.ts`](../../src/report/catalog.ts)

**コード修正案** 既存の文字列出力は保ち、ペアを持つ列を明示してセル表示時に選ぶ。行のキー、データリンク、並べ替え対象の規則を表示モードと分ける。

### 関数・型の変更一覧

#### 既存関数 `RowsTable`

**引数・戻り値**

```text
RowsTable(props: { rows: Row[]; columns?: Column[] | null; caption?: string | null; showSource?: boolean | null; displayMode?: ApiDisplayMode }): ReactElement
```

**方針**

- `RowsTable` と `MatrixView` のセル描画を、指定列だけAPI名・ラベルを切り替える形へ変える。
- 既存文字列は cellText で通常表示する。

#### 既存関数 `MatrixView`

**引数・戻り値**

```text
MatrixView(props: { data: MatrixData<unknown> | undefined; onlyChanged?: boolean | null; displayMode?: ApiDisplayMode }): ReactElement | null
```

**方針**

- `RowsTable` と `MatrixView` のセル描画を、指定列だけAPI名・ラベルを切り替える形へ変える。

#### 既存型 `Column`

**属性・型**

```text
Column { key: string; label: string; displayName?: boolean }
```

**方針**

- 表示対象の provider 行または部品 props に名前ペアを任意で持たせる。
- 行識別子と出力上のAPI名は維持する。

#### 新規関数 `displayNameOf`

**引数・戻り値**

```text
displayNameOf(value: DisplayName, mode: ApiDisplayMode): string
```

**方針**

- `displayNameOf(value, mode)` はラベル欠落時にAPI名へフォールバックする。
- 既存のリンク生成には ID を引き続き渡す。

#### 新規型 `ApiDisplayMode`

**属性・型**

```text
ApiDisplayMode = 'apiName' | 'label'
```

**方針**

- `DisplayName` は id・apiName・任意の label、`ApiDisplayMode` は apiName/label。

#### 新規型 `DisplayName`

**属性・型**

```text
DisplayName { id: string; apiName: string; label?: string }
```

**方針**

- `DisplayName` は id・apiName・任意の label、`ApiDisplayMode` は apiName/label。

**処理・互換性の補足** 対象セルのデータは安定ID、API名、表示ラベルを区別し、表示モードだけを viewer の状態で切り替える。ラベル欠損時の表示はAPI名とし、リンク先はIDを使う。

**変更コード案**

```ts
// src/viewer/report/components/rowsTable.tsx + matrix.tsx
type ApiDisplayMode = 'apiName' | 'label';
type DisplayName = { id: string; apiName: string; label?: string };
function displayNameOf(value: DisplayName, mode: ApiDisplayMode): string {
    return mode === 'label' ? value.label || value.apiName : value.apiName;
}
// 既存文字列セルは cellText を使い、DisplayName のセルだけこの処理を使う。
// リンクと行選択は表示文字列ではなく value.id に結び付ける。
```

**確認ケース** 同名ラベル、ラベルのない行、切替前後でリンクや選択対象が一致することを確認する。

<a id="implementation-detail-94"></a>

## 94. 依存関係の図を図として描く

**解決したい問題** オブジェクトやApexの依存図を拡大し、ノードを選択して対象名を確認したい。

**現行コード** getDependencyDiagram は対象範囲を選んで Mermaid/DOT の format/text を返す。DiagramTextView が受け取る形式からは、操作可能なノード・辺に直接アクセスできない。

**主な修正先** [`src/analyzer/report/dependency.ts`](../../src/analyzer/report/dependency.ts)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/viewer/autoNodeLayout.tsx`](../../src/viewer/autoNodeLayout.tsx)

**新規パス候補** `src/viewer/report/components/dependencyGraph.tsx`

**コード修正案** 既存の範囲計算を共有して構造化したノードと辺を返す入口を追加する。新部品は toElements 相当で React Flow の source/target に変換し、従来のテキストproviderとの契約も残す。

### 関数・型の変更一覧

#### 既存関数 `getDependencyDiagram`

**引数・戻り値**

```text
getDependencyDiagram(input: ReportInput, args?: { targets?: string[]; depth?: number; format?: 'mermaid' | 'dot' }): { format: 'mermaid' | 'dot'; text: string }
```

**方針**

- `getDependencyDiagram` の対象範囲選択を共通化し、既存の Mermaid/DOT 出力にもその範囲を使う。
- viewer の登録に新部品を足す。

#### 既存型の直接変更なし

**方針**

- 既存 `DependencyDiagramSchema` の format/text は維持する。構造化データは別スキーマとして登録する。

#### 新規関数 `getDependencyGraphView`

**引数・戻り値**

```text
getDependencyGraphView(input: ReportInput, args?: { targets?: string[]; depth?: number }): GraphViewData
```

**方針**

- `getDependencyGraphView(input, args)` は対象ノード・辺を返す。

#### 新規関数 `flowEdges`

**引数・戻り値**

```text
flowEdges(data: GraphViewData): Edge[]
```

**方針**

- `flowEdges(data)` とノード変換が React Flow の入口を構成する。

#### 新規型 `GraphViewData`

**属性・型**

```text
GraphViewData { nodes: readonly { id: string; label: string; type: string }[]; edges: readonly { id: string; from: string; to: string; label?: string }[] }
```

**方針**

- `GraphViewData` は ID・表示名・種別のノードと、ID・両端・任意ラベルの辺。

**処理・互換性の補足** 依存ノードのIDと辺の両端を React Flow の入力へ変換し、レイアウトを既存の viewer 処理に接続する。状態・向き・ラベルの見せ方を決め、既存の DiagramText 登録を維持する。

**変更コード案**

```ts
// src/analyzer/report/dependency.ts + src/viewer/report/components/dependencyGraph.tsx
type GraphViewData = {
    nodes: readonly { id: string; label: string; type: string }[];
    edges: readonly { id: string; from: string; to: string; label?: string }[];
};
function flowEdges(data: GraphViewData) {
    return data.edges.map((edge) => ({
        id: edge.id, source: edge.from, target: edge.to, label: edge.label,
    }));
}
// 新しい構造化出力を getDependencyDiagram と同じ範囲選択へ接続する。
// 既存の format/text 出力は DiagramText で引き続き使う。
```

**確認ケース** 循環、孤立ノード、複数の辺、既存のテキスト図を含む文書で表示を確認する。

<a id="implementation-detail-95"></a>

## 95. 差分の木

**解決したい問題** あるクラスの複数の変更から1メソッドを選び、前後ソースを比較したい。

**現行コード** 現行 viewer はソース抜粋を描画できるが、構造差分の親子関係を選択可能な木として描画する部品がない。

**主な修正先** [`src/analyzer/processor/commons/diff/`](../../src/analyzer/processor/commons/diff/)、[`src/analyzer/report/registry.ts`](../../src/analyzer/report/registry.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)

**新規パス候補** `src/viewer/report/components/diffTree.tsx`、`src/viewer/report/components/sourceDiff.tsx`

**コード修正案** 差分の単位・子要素を安定IDで階層化して Data Binding へ登録する。木が選んだIDから前後の抜粋を引き、欠落した側を追加・削除と取得不能で区別する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- 構造Diffと `attachSources` の既存抜粋取得を木データへ接続し、viewer のデータバインディングに登録する。

#### 既存型の直接変更なし

**方針**

- 既存の差分ノードと `SourceExcerpt` を利用する。URLや案内用の文字列は木の形と分ける。

#### 新規関数 `toDiffTree`

**引数・戻り値**

```text
toDiffTree(diff: readonly RepositoryUnitDiff[], excerpts: ReadonlyMap<string, DiffTreeItem['excerpts']>): DiffTreeItem[]
```

**方針**

- `toDiffTree(diff, excerpts)` は構造差分を木へ変換する。

#### 新規関数 `DiffTree`

**引数・戻り値**

```text
DiffTree(props: { items: readonly DiffTreeItem[] }): ReactElement
```

**方針**

- `DiffTree` は選択を管理し、`SourceDiff` は選択された前後抜粋を表示する。

#### 新規関数 `SourceDiff`

**引数・戻り値**

```text
SourceDiff(props: { item: DiffTreeItem }): ReactElement
```

**方針**

- `DiffTree` は選択を管理し、`SourceDiff` は選択された前後抜粋を表示する。

#### 新規型 `DiffTreeItem`

**属性・型**

```text
DiffTreeItem { id: string; label: string; status: 'added' | 'removed' | 'changed'; children: readonly DiffTreeItem[]; excerpts?: { before?: SourceExcerpt; after?: SourceExcerpt } }
```

**方針**

- `DiffTreeItem` は id・label・status・children・任意の before/after 抜粋を持つ。

**処理・互換性の補足** 差分項目のID、親ID、状態から階層を組む。選択時は該当 sourceKeys で前後の抜粋を引き、片側が存在しない変更は該当側を空で示す。

**変更コード案**

```tsx
// src/viewer/report/components/diffTree.tsx + sourceDiff.tsx
type DiffTreeItem = {
    id: string;
    label: string;
    status: 'added' | 'removed' | 'changed';
    children: readonly DiffTreeItem[];
    excerpts?: { before?: SourceExcerpt; after?: SourceExcerpt };
};
function SourceDiff({ item }: { item: DiffTreeItem }) {
    return <div className="source-diff">
        {item.excerpts?.before ? <SourceSnippet excerpt={item.excerpts.before} /> : <p>変更前なし</p>}
        {item.excerpts?.after ? <SourceSnippet excerpt={item.excerpts.after} /> : <p>変更後なし</p>}
    </div>;
}
```

**確認ケース** 追加のみ、削除のみ、同一ファイルに複数変更、抜粋を取得できないケースを確認する。

<a id="implementation-detail-96"></a>

## 96. `CodeFlowchart` の改修

**解決したい問題** 入れ子のループの戻り線を見分け、ノード選択時に対応するソースを眺めながら図の縦幅を変えたい。

**現行コード** codeFlowchart.tsx の OneChart はすでにノード選択と detail、計算した高さを持つ。修正対象は戻り線の配置、全文抜粋との対応、利用者による高さ変更。

**主な修正先** [`src/viewer/report/components/codeFlowchart.tsx`](../../src/viewer/report/components/codeFlowchart.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/viewer/autoNodeLayout.tsx`](../../src/viewer/autoNodeLayout.tsx)

**コード修正案** toElements で back を通常の配置制約から外し、配置済み座標から戻り辺を作る。既存 detail の位置に sourceKeys 由来の抜粋を渡し、高さ調整状態は選択と分離する。

### 関数・型の変更一覧

#### 既存関数 `toElements`

**引数・戻り値**

```text
toElements(flow: CodeFlow, selected: string | null): { nodes: ChartNode[]; edges: Edge[] }
```

**方針**

- `toElements` は back 辺を配置制約から分ける。

#### 既存関数 `OneChart`

**引数・戻り値**

```text
OneChart(props: { flow: CodeFlow; height: number | null }): ReactElement
```

**方針**

- `OneChart` は既存の選択表示に取得済みソースを結び付け、ユーザー変更後の高さを使う。

#### 既存型 `CodeFlowNode`

**属性・型**

```text
CodeFlowNode { sourceKeys?: ConvertKeys }
```

**方針**

- `CodeFlowNodeSchema` に必要な場合だけソース位置または参照を追加する。
- `CodeFlowEdge` の back 種別は変えない。

#### 新規関数 `routeBackEdge`

**引数・戻り値**

```text
routeBackEdge(edge: CodeFlowEdge, positions: ReadonlyMap<string, { x: number; y: number }>): string
```

**方針**

- `routeBackEdge(edge, positions)` はレイアウト済み座標から描画経路を求める。

#### 新規関数 `selectNode`

**引数・戻り値**

```text
selectNode(selectedId: string): void
```

**方針**

- `selectNode` と `resizeChart` は OneChart の内部操作。

#### 新規関数 `resizeChart`

**引数・戻り値**

```text
resizeChart(height: number): void
```

**方針**

- `selectNode` と `resizeChart` は OneChart の内部操作。

#### 新規型 `FlowchartControls`

**属性・型**

```text
FlowchartControls { selectedId: string | null; height: number }
```

**方針**

- `FlowchartControls` は選択IDと高さ。
- 独立の useState にするならこの型は不要。

**処理・互換性の補足** ループの戻り辺はフローデータの種別から識別して外側に配線する。選択したノードから既存のソース表示に抜粋を渡し、高さ変更はレイアウト座標と独立して保持する。

**変更コード案**

```tsx
// src/viewer/report/components/codeFlowchart.tsx
type FlowchartControls = { selectedId: string | null; height: number };
const [controls, setControls] = useState<FlowchartControls>({ selectedId: null, height: 480 });
const selected = flow.nodes.find(({ id }) => id === controls.selectedId);
const selectNode = (selectedId: string) => setControls((current) => ({ ...current, selectedId }));
const resizeChart = (height: number) =>
    setControls((current) => ({ ...current, height: Math.max(240, height) }));
// Flow の kind === 'back' は通常の配置制約から分け、配置後に戻り線として描く。
// 選択したノードの detail は図の下部に置く。
```

**確認ケース** ネストしたループ、ソースがないノード、高さ変更後のスクロールと選択を確認する。

<a id="implementation-detail-100"></a>

## 100. `SequenceDiagram` の改修

**解決したい問題** A→B→C の呼び出しで、B がいつ処理を開始・終了するかと戻り値を読みたい。長い場合は B の配下を閉じたい。

**現行コード** OneSequence は既存の参加者とメッセージを描く。表示の行番号だけでは呼出し階層、活性区間、縮める範囲を識別できない。

**主な修正先** [`src/viewer/report/components/sequenceDiagram.tsx`](../../src/viewer/report/components/sequenceDiagram.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/analyzer/report/apexCallFlow.ts`](../../src/analyzer/report/apexCallFlow.ts)、[`src/analyzer/report/schemas.ts`](../../src/analyzer/report/schemas.ts)

**コード修正案** 生成側で親 callId と対応する応答情報を持たせる。描画では開閉した callId を除いた行から区間を再計算し、固定見出しの列座標を共有する。

### 関数・型の変更一覧

#### 既存関数 `getApexCallFlows`

**引数・戻り値**

```text
getApexCallFlows(input: SnapshotInput, filter?: ApexCallFlowFilter): CallSequence[]
```

**方針**

- `getApexCallFlows` は呼出しID・親呼出しID・確定した戻り値を渡す。

#### 既存関数 `OneSequence`

**引数・戻り値**

```text
OneSequence(props: { sequence: CallSequence }): ReactElement
```

**方針**

- `OneSequence` は開閉後の行・活性区間と固定見出しの位置を計算する。

#### 既存型 `CallSequenceMessage`

**属性・型**

```text
CallSequenceMessage { callId?: string; parentCallId?: string; returnValue?: string }
```

**方針**

- `CallSequenceMessageSchema` に任意の呼出し情報、`CallSequenceSchema` に活動区間を追加する。
- 旧メッセージは従来描画へ戻す。

#### 既存型 `CallSequence`

**属性・型**

```text
CallSequence { activations?: Activation[] }
```

**方針**

- `CallSequenceMessageSchema` に任意の呼出し情報、`CallSequenceSchema` に活動区間を追加する。

#### 新規関数 `visibleSequenceMessages`

**引数・戻り値**

```text
visibleSequenceMessages(sequence: CallSequence, collapsedIds: ReadonlySet<string>): CallSequenceMessage[]
```

**方針**

- `visibleSequenceMessages(sequence, collapsedIds)` は表示メッセージを選ぶ。

#### 新規関数 `activationIntervals`

**引数・戻り値**

```text
activationIntervals(messages: readonly CallSequenceMessage[]): Activation[]
```

**方針**

- `activationIntervals(messages)` は描画行から参加者ごとの区間を作る。

#### 新規型 `Activation`

**属性・型**

```text
Activation { participant: string; callId: string; firstMessage: number; lastMessage: number }
```

**方針**

- `ActivationSchema` は参加者、callId、先頭・末尾行。

#### 新規型 `SequenceState`

**属性・型**

```text
SequenceState { collapsedCallIds: ReadonlySet<string> }
```

**方針**

- `SequenceState` は閉じているID、`SequenceReply` は応答IDと任意の戻り値。

#### 新規型 `SequenceReply`

**属性・型**

```text
SequenceReply { callId: string; returnValue?: string }
```

**方針**

- `SequenceState` は閉じているID、`SequenceReply` は応答IDと任意の戻り値。

**処理・互換性の補足** 呼出しの開始・終了イベントから参加者の活性区間を組み、解析で得られた戻り値だけを応答に載せる。折りたたみ単位は呼出し階層のIDを使い、固定見出しを図本体と同期する。

**変更コード案**

```ts
// src/analyzer/report/schemas.ts + src/viewer/report/components/sequenceDiagram.tsx
const ActivationSchema = z.object({
    participant: z.string(),
    callId: z.string(),
    firstMessage: z.number().int().nonnegative(),
    lastMessage: z.number().int().nonnegative(),
});
type SequenceState = { collapsedCallIds: ReadonlySet<string> };
type SequenceReply = { callId: string; returnValue?: string };
// callId は呼出し元とソース位置から生成し、応答・活性区間・折りたたみで共有する。
```

**確認ケース** ネストする呼出し、戻り値不明、長い図、折りたたみ後の線と見出しの位置を確認する。

<a id="implementation-detail-104"></a>

## 104. `EventFlow` のまとまり

**解決したい問題** 親コンポーネント内の処理と子へのイベント伝播を別のまとまりとして読みたい。

**現行コード** eventFlow.tsx の toElements はイベントノードを平坦な対象として配置する。所属コンポーネントごとの枠を持たない。

**主な修正先** [`src/viewer/report/components/eventFlow.tsx`](../../src/viewer/report/components/eventFlow.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/analyzer/report/lwcEventFlow.ts`](../../src/analyzer/report/lwcEventFlow.ts)

**コード修正案** コンポーネントIDで親枠を作り、子をその親基準座標へ移す。枠をまたぐ辺は子IDへつなぎ、入れ子と親のないノードも描けるようにする。

### 関数・型の変更一覧

#### 既存関数 `toElements`

**引数・戻り値**

```text
toElements(flow: EventFlow): { nodes: ChartNode[]; edges: Edge[] }
```

**方針**

- `eventFlow.tsx` の `toElements` で所属別に配置した後、子ノードを枠内座標に変換する。
- 枠間の辺は従来の子IDへつなぐ。

#### 既存型 `EventFlowNode`

**属性・型**

```text
EventFlowNode { component?: string }
```

**方針**

- `EventFlowNodeSchema` に所属情報が不足している場合だけ任意で加える。
- viewer 内のノードには親IDを渡す。

#### 新規関数 `toGroupedNode`

**引数・戻り値**

```text
toGroupedNode(node: PositionedEventNode, origins: ReadonlyMap<string, { x: number; y: number }>): PositionedEventNode & { parentId?: string }
```

**方針**

- `toGroupedNode(node, origins)` は所属コンポーネントがあるとき、絶対位置から枠の相対位置へ変換する。

#### 新規型 `PositionedEventNode`

**属性・型**

```text
PositionedEventNode { id: string; component?: string; position: { x: number; y: number } }
```

**方針**

- `PositionedEventNode` は id・所属・座標を持つ描画用型。
- React Flow の型を直接使える場合は別型を増やさない。

**処理・互換性の補足** 各ノードを所属コンポーネントで束ね、グループ内の相対位置に変換する。枠をまたぐ辺は子ノードIDで接続し、所属が不明なノードも配置する。

**変更コード案**

```ts
// src/viewer/report/components/eventFlow.tsx
type PositionedEventNode = { id: string; component?: string; position: { x: number; y: number } };
function toGroupedNode(node: PositionedEventNode, origins: ReadonlyMap<string, { x: number; y: number }>) {
    const parentId = node.component ? 'component:' + node.component : undefined;
    const origin = parentId ? origins.get(parentId) : undefined;
    if (!origin || !parentId) return node;
    return {
        ...node, parentId,
        position: { x: node.position.x - origin.x, y: node.position.y - origin.y },
    };
}
// React Flow のノード配列はグループノードを先に並べる。
```

**確認ケース** 同一コンポーネント内の辺、別コンポーネント間の辺、親枠を移動した後の接続を確認する。

<a id="implementation-detail-105"></a>

## 105. Flow の図と見た目をそろえる

**解決したい問題** Salesforce Flow と Apex 処理フローを横に見たとき、同じ分岐は同じ意味として認識したい。

**現行コード** flowDiagram.tsx と codeFlowchart.tsx がノードを個別にスタイル化している。CodeFlowchart は KIND_COLORS に独自定義を持つ。

**主な修正先** [`src/viewer/report/components/flowDiagram.tsx`](../../src/viewer/report/components/flowDiagram.tsx)、[`src/viewer/report/components/codeFlowchart.tsx`](../../src/viewer/report/components/codeFlowchart.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)

**コード修正案** 両側の kind を start/end/decision/process などの共有ロールへ写し、CSSで色と形を定義する。固有ノードの表示や差分色の優先順を明示する。

### 関数・型の変更一覧

#### 既存関数 `flowDiagram.toElements`

**引数・戻り値**

```text
flowDiagram.toElements(diagram: FlowDiagram): { nodes: FlowNode[]; edges: Edge[] }
```

**方針**

- `flowDiagram.tsx` と `codeFlowchart.tsx` の `toElements` で既存の kind から同じ CSS の data-role を付ける。

#### 既存関数 `codeFlowchart.toElements`

**引数・戻り値**

```text
codeFlowchart.toElements(flow: CodeFlow, selected: string | null): { nodes: ChartNode[]; edges: Edge[] }
```

**方針**

- `flowDiagram.tsx` と `codeFlowchart.tsx` の `toElements` で既存の kind から同じ CSS の data-role を付ける。

#### 既存型の直接変更なし

**方針**

- provider の図・ノード型は維持する。表示上のロールは内部に閉じる。

#### 新規関数 `flowNodeRole`

**引数・戻り値**

```text
flowNodeRole(kind: string): FlowNodeRole | undefined
```

**方針**

- `flowNodeRole(kind)` は開始・終了・分岐・処理に対応するスタイル名を返す。
- 該当しない固有ノードは既存スタイルを使う。

#### 新規型 `FlowNodeRole`

**属性・型**

```text
FlowNodeRole = 'start' | 'end' | 'decision' | 'process'
```

**方針**

- 必要なら内部の `FlowNodeRole` に共通の4ロールを列挙する。
- 外部スキーマは追加しない。

**処理・互換性の補足** 開始、終端、分岐、処理に共通の色と形を定義し、それぞれの図が既存のノード種別から対応付ける。既存の Flow 固有種別と差分状態を優先する条件も定義する。

**変更コード案**

```css
/* src/viewer/report/styles.css */
.report-flow-node[data-role='start'],
.report-flow-node[data-role='end'] {
    border-radius: 999px;
    background: var(--flow-terminal-background);
}
.report-flow-node[data-role='decision'] {
    border-color: var(--flow-decision-border);
    background: var(--flow-decision-background);
}
/* flowDiagram.tsx と codeFlowchart.tsx で kind を共通の data-role へ写す。 */
```

**確認ケース** 代表的な共通ノード、Flow固有ノード、変更色が付いたノードを二つの図で比較する。

<a id="implementation-detail-109"></a>

## 109. `PageLink` を一覧で並べる

**解決したい問題** 何百クラスもの目次を1件1行ではなく、画面幅に応じて複数列で一覧したい。

**現行コード** splitPages はページごとに PageLink を一件出し、registry の PageLink も一件ずつ描く。

**主な修正先** [`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)

**コード修正案** 同じ親の中で連続したリンクを、元の順序と説明を保った links 配列へ畳む。カタログに一覧部品を登録し、狭い画面では1列に落とす。

### 関数・型の変更一覧

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `splitPages` のリンク生成後に同じ親の連続リンクをまとめ、viewer registry で一覧の描画を登録する。

#### 既存型の直接変更なし

**方針**

- 既存 `PageLink` の props は維持し、カタログへ一覧用の部品定義を加える。

#### 新規関数 `groupAdjacentPageLinks`

**引数・戻り値**

```text
groupAdjacentPageLinks(elements: Spec['elements'], children: readonly string[]): string[]
```

**方針**

- `groupAdjacentPageLinks(elements, children)` は他部品を境界にリンクをまとめ、`PageLinks` は複数列または狭幅1列で描画する。

#### 新規関数 `PageLinks`

**引数・戻り値**

```text
PageLinks(props: PageLinksProps): ReactElement
```

**方針**

- `groupAdjacentPageLinks(elements, children)` は他部品を境界にリンクをまとめ、`PageLinks` は複数列または狭幅1列で描画する。

#### 新規型 `PageLinkItem`

**属性・型**

```text
PageLinkItem { title: string; href: string; description?: string | null }
```

**方針**

- `PageLinkItem` はタイトル・URL・説明、`PageLinksProps` はその非空配列を持つ Zod スキーマ。

#### 新規型 `PageLinksProps`

**属性・型**

```text
PageLinksProps { links: PageLinkItem[] }
```

**方針**

- `PageLinkItem` はタイトル・URL・説明、`PageLinksProps` はその非空配列を持つ Zod スキーマ。

**処理・互換性の補足** 同一コンテナで連続する PageLink を一覧として描画し、各リンクの title、href、description を保持する。普通の部品をまたいでリンクを集約しない。

**変更コード案**

```ts
// src/builder/pages.ts + src/report/catalog.ts
const PageLinkItem = z.object({
    title: z.string(),
    href: z.string(),
    description: z.string().nullable().optional(),
});
const PageLinksProps = z.object({ links: z.array(PageLinkItem).min(1) });
// splitPages のリンク生成後、同じ親の連続した PageLink を PageLinks へ変換する。
// 単独の PageLink と従来の文書も registry で描画できるままにする。
```

**確認ケース** 単独リンク、説明の有無、途中にカードがある並び、狭い画面幅で確認する。

<a id="implementation-detail-110"></a>

## 110. ページの間のリンク

**解決したい問題** コールフローの AccountService を選んで仕様ページへ移動し、そこから該当ファイルを開きたい。

**現行コード** splitPages はページごとの物理 file と href を持つが、図や表が単位の安定IDから成果物のURLを引く共通索引はない。

**主な修正先** [`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/viewer/report/components/rowsTable.tsx`](../../src/viewer/report/components/rowsTable.tsx)、[`src/viewer/report/components/sequenceDiagram.tsx`](../../src/viewer/report/components/sequenceDiagram.tsx)、[`src/analyzer/unit/gitRange.ts`](../../src/analyzer/unit/gitRange.ts)

**新規パス候補** `src/viewer/report/links.ts`

**コード修正案** ファイル名割当後に unitId→file を構築し、表示元ファイルを基準とした相対リンクを作る。ソースリンクは解析済みファイルパスと行、設定済みのリポジトリ情報から生成する。

### 関数・型の変更一覧

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `splitPages` が各ページのファイル名決定後に単位IDとの対応を組み立てる。
- 表・シーケンスの既存表示が有効なリンクだけ表示する。

#### 既存型 `SplitPage`

**属性・型**

```text
SplitPage { unitId?: string }
```

**方針**

- `SplitPage`／`EmbeddedReport` に必要な単位IDや参照索引を任意で持たせる。
- 既存ファイル名とページ移動の処理は互換にする。

#### 既存型 `EmbeddedReport`

**属性・型**

```text
EmbeddedReport { pageLinks?: PageLinkIndex }
```

**方針**

- `SplitPage`／`EmbeddedReport` に必要な単位IDや参照索引を任意で持たせる。

#### 新規関数 `unitPageHref`

**引数・戻り値**

```text
unitPageHref(unitId: string, pages: PageLinkIndex): string | undefined
```

**方針**

- `unitPageHref(unitId, pages)` は既知ページの参照を引く。

#### 新規関数 `githubFileHref`

**引数・戻り値**

```text
githubFileHref(base: URL, source: SourceLink): string
```

**方針**

- `githubFileHref(base, source)` と VS Code 用の生成処理がファイル名・行をエンコードする。

#### 新規関数 `vscodeFileHref`

**引数・戻り値**

```text
vscodeFileHref(root: string, source: SourceLink): string
```

**方針**

- `unitPageHref(unitId, pages)` は既知ページの参照を引く。

#### 新規型 `PageLinkIndex`

**属性・型**

```text
PageLinkIndex = Readonly<Record<string, string>>
```

**方針**

- `PageLinkIndex` は単位ID→生成先、`SourceLink` はリポジトリ内相対パスと任意の行番号。

#### 新規型 `SourceLink`

**属性・型**

```text
SourceLink { path: string; line?: number }
```

**方針**

- `PageLinkIndex` は単位ID→生成先、`SourceLink` はリポジトリ内相対パスと任意の行番号。

**処理・互換性の補足** 全ページのファイル名確定後に単位ID→相対URLの索引を生成する。ソースへのリンクはファイルパス・行番号と利用可能なリポジトリ情報から選び、パス部分をエンコードする。

**変更コード案**

```ts
// src/viewer/report/links.ts
type PageLinkIndex = Readonly<Record<string, string>>;
type SourceLink = { path: string; line?: number };
function unitPageHref(unitId: string, pages: PageLinkIndex): string | undefined {
    return Object.hasOwn(pages, unitId) ? pages[unitId] : undefined;
}
function githubFileHref(base: URL, source: SourceLink): string {
    const path = source.path.split('/').map(encodeURIComponent).join('/');
    const url = new URL(path, base);
    if (source.line) url.hash = 'L' + String(source.line);
    return url.href;
}
// base は検証済みリポジトリとリビジョン、source は Repository 内の相対パスから作る。
```

**確認ケース** クラス名の重複、ネストページ、日本語・空白を含むパス、リンク先ページが生成されない場合を確認する。

<a id="implementation-detail-111"></a>

## 111. MCP Apps の画面でページを開く

**解決したい問題** MCP Apps の目次から個別ページを選び、アプリ内で内容を確認できるようにしたい。

**現行コード** main.tsx の reportOfResult は _meta または structuredContent から一つの EmbeddedReport を読む。HTMLサイトの pages はその受信モデルにない。

**主な修正先** [`src/mcp/reportTools.ts`](../../src/mcp/reportTools.ts)、[`src/mcp/appResources.ts`](../../src/mcp/appResources.ts)、[`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/report/embedding.ts`](../../src/report/embedding.ts)、[`src/viewer/report/main.tsx`](../../src/viewer/report/main.tsx)、[`src/viewer/report/view.tsx`](../../src/viewer/report/view.tsx)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)

**コード修正案** ページ一覧と初期ページを持つ payload を追加する。選択されたページの spec/state を読み込む入口を持たせ、旧 EmbeddedReport の入力とファイルで開くビューも受け付ける。

### 関数・型の変更一覧

#### 既存関数 `registerReportTools`

**引数・戻り値**

```text
registerReportTools(server: McpServer, source: ProcessorSource, options?: ReportToolOptions): void
```

**方針**

- `registerReportTools` の build_report 応答にページ情報を追加し、`reportOfResult` と `render` が初期ページ・切替結果を受け取る。

#### 既存関数 `reportOfResult`

**引数・戻り値**

```text
reportOfResult(result: { _meta?: Record<string, unknown>; structuredContent?: Record<string, unknown> }): EmbeddedReport | ReportAppPayload | null
```

**方針**

- `registerReportTools` の build_report 応答にページ情報を追加し、`reportOfResult` と `render` が初期ページ・切替結果を受け取る。

#### 既存関数 `render`

**引数・戻り値**

```text
render(root: Root, report: EmbeddedReport | ReportAppPayload | null, message: string): void
```

**方針**

- `registerReportTools` の build_report 応答にページ情報を追加し、`reportOfResult` と `render` が初期ページ・切替結果を受け取る。

#### 既存型の直接変更なし

**方針**

- 既存 `EmbeddedReport` は1ページの型として維持する。Appの受信値は従来1ページまたは新規payloadを受け付ける。

#### 新規関数 `requestedPage`

**引数・戻り値**

```text
requestedPage(cache: PageCache, request: PageRequest): ReportPageResponse
```

**方針**

- `requestedPage(cache, request)` は利用中レポートIDとページIDで取得する。
- viewer のページ選択処理は応答の `spec/state` へ差し替える。

#### 新規型 `ReportPageRef`

**属性・型**

```text
ReportPageRef { id: string; title: string }
```

**方針**

- `ReportAppPayload`、`ReportPageRef`、`PageRequest`、`ReportPageResponse`、`PageCache` は初期値・一覧・個別読込契約を表す。

#### 新規型 `ReportAppPayload`

**属性・型**

```text
ReportAppPayload { reportId: string; initialPageId: string; pages: readonly ReportPageRef[]; initial: EmbeddedReport }
```

**方針**

- `ReportAppPayload`、`ReportPageRef`、`PageRequest`、`ReportPageResponse`、`PageCache` は初期値・一覧・個別読込契約を表す。

#### 新規型 `PageRequest`

**属性・型**

```text
PageRequest { reportId: string; pageId: string }
```

**方針**

- `ReportAppPayload`、`ReportPageRef`、`PageRequest`、`ReportPageResponse`、`PageCache` は初期値・一覧・個別読込契約を表す。

#### 新規型 `ReportPageResponse`

**属性・型**

```text
ReportPageResponse = { ok: true; page: EmbeddedReport } | { ok: false; message: string }
```

**方針**

- `ReportAppPayload`、`ReportPageRef`、`PageRequest`、`ReportPageResponse`、`PageCache` は初期値・一覧・個別読込契約を表す。

#### 新規型 `PageCache`

**属性・型**

```text
PageCache = ReadonlyMap<string, ReadonlyMap<string, EmbeddedReport>>
```

**方針**

- `ReportAppPayload`、`ReportPageRef`、`PageRequest`、`ReportPageResponse`、`PageCache` は初期値・一覧・個別読込契約を表す。

**処理・互換性の補足** MCPの埋め込み結果にページIDと読込用の参照を追加し、初期ページと画面内の履歴を定義する。ページごとに必要な state を選び、生成量が多いときは全ページを一度に展開しない方式を検討する。

**変更コード案**

```ts
// src/report/embedding.ts + src/mcp/reportTools.ts
type ReportPageRef = { id: string; title: string };
type ReportAppPayload = {
    initialPageId: string;
    pages: readonly ReportPageRef[];
    initial: EmbeddedReport;
};
type ReportPageResponse =
    | { ok: true; page: EmbeddedReport }
    | { ok: false; message: string };
// 表示中にページIDを取得ツールへ渡し、取得結果の spec/state だけを切り替える。
```

**適用箇所のコード案**

```ts
// reportTools.ts / viewer/report/main.tsx 間の取得契約
type PageRequest = { reportId: string; pageId: string };
type PageCache = ReadonlyMap<string, ReadonlyMap<string, EmbeddedReport>>;
function requestedPage(cache: PageCache, request: PageRequest): ReportPageResponse {
    const page = cache.get(request.reportId)?.get(request.pageId);
    return page
        ? { ok: true, page }
        : { ok: false, message: '対象のレポートページを取得できません。' };
}
// reportId を build_report 応答へ含め、同じ処理コンテキストのキャッシュでのみ検索する。
// pageId は公開した一覧の値に限定し、ファイルパスとして扱わない。
```

**確認ケース** 目次から2ページを往復し、比較ラベルとソース表示が切替先でも対応することを確認する。

<a id="implementation-detail-112"></a>

## 112. ページの中の目次

**解決したい問題** 一つの仕様ページのメソッドが多い場合、ページ内で見出しから目的のメソッドへ移動したい。

**現行コード** ReportView は渡された spec を描画するが、任意のカード見出しを収集したページ内目次は組み立てない。

**主な修正先** [`src/viewer/report/view.tsx`](../../src/viewer/report/view.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/report/catalog.ts`](../../src/report/catalog.ts)

**コード修正案** ページ切り出し後の spec.root から表示順に収集し、タイトルがある対象カードに要素キー由来の anchor を割当てる。目次とカードの id は同じ関数を使う。

### 関数・型の変更一覧

#### 既存関数 `ReportView`

**引数・戻り値**

```text
ReportView(props: { report: EmbeddedReport }): ReactElement
```

**方針**

- `ReportView` が現在の spec を描画する前に、表示するカードを spec.root から順に調べる。
- カード描画へアンカーを渡す。

#### 既存型 `CardProps`

**属性・型**

```text
CardProps { id?: string }
```

**方針**

- `EmbeddedReport` の既存形式は維持する。
- カードが内部 id を受ける必要がある場合だけ部品の描画propsを拡張する。

#### 新規関数 `cardHeading`

**引数・戻り値**

```text
cardHeading(key: string, type: string, props: { title?: unknown }): ReportHeading[]
```

**方針**

- `cardHeading(key, type, props)` はタイトルを持つカードからアンカーを作る。

#### 新規関数 `collectReportHeadings`

**引数・戻り値**

```text
collectReportHeadings(spec: Spec, state: State): ReportHeading[]
```

**方針**

- `collectReportHeadings(spec, state)` は有効な表示順の項目を返す。

#### 新規型 `ReportHeading`

**属性・型**

```text
ReportHeading { anchor: string; title: string }
```

**方針**

- `ReportHeading` はアンカーと表示タイトル。

**処理・互換性の補足** 展開済みのページ要素を表示順にトラバースして、見出しと要素キーを集める。DOMのidは同名見出しでも一意にし、目次アンカーと同じ値を使う。

**変更コード案**

```ts
// src/viewer/report/view.tsx
type ReportHeading = { anchor: string; title: string };
function cardHeading(key: string, type: string, props: { title?: unknown }): ReportHeading[] {
    if (type !== 'Card' || typeof props.title !== 'string' || !props.title) return [];
    return [{ anchor: 'report-heading-' + encodeURIComponent(key), title: props.title }];
}
// spec.root から有効な子要素を描画順で収集し、カードの id と目次 href を同じ値から作る。
```

**確認ケース** 見出しなし、同名のカード、条件付きで消えるカード、分割ページごとの目次を確認する。

<a id="implementation-detail-116"></a>

## 116. `Card` と表をまとめた部品

**解決したい問題** タイトル付きの一覧を作るたびに、Card と DataTable の要素IDや関連を2組書く手間を減らしたい。

**現行コード** catalog.ts と registry.tsx はカードと表を個別に定義する。detailTemplates.ts では二つを構成して使う。

**主な修正先** [`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/report/detailTemplates.ts`](../../src/report/detailTemplates.ts)、[`src/report/domainTemplates.ts`](../../src/report/domainTemplates.ts)、[`src/viewer/report/registry.tsx`](../../src/viewer/report/registry.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)

**新規パス候補** `src/viewer/report/components/cardTable.tsx`

**コード修正案** 共通の CardTable props にタイトル等と既存表のデータ指定を持たせる。カタログのデータバインディング検証と registry のカード・表描画を再利用する。

### 関数・型の変更一覧

#### 既存関数の直接変更なし

**方針**

- カタログと viewer registry で部品を登録し、既存テンプレートで該当箇所を新部品へ置き換える。既存カード描画を部品間で使える入口にする。

#### 既存型の直接変更なし

**方針**

- 既存 `Card`・`DataTable` の props スキーマは維持する。新部品のスキーマはそれらの必要属性を組み合わせる。

#### 新規関数 `CardTable`

**引数・戻り値**

```text
CardTable(props: CardTableProps): ReactElement
```

**方針**

- `CardTable(props)` は既存カードの中で `RowsTable` を描画する。

#### 新規関数 `ReportCard`

**引数・戻り値**

```text
ReportCard(props: { title: string; description?: string; children: ReactNode }): ReactElement
```

**方針**

- 必要であれば既存カード描画を `ReportCard` として切り出す。

#### 新規型 `CardTableProps`

**属性・型**

```text
CardTableProps { title: string; description?: string; rows: Row[]; columns?: Column[] | null; showSource?: boolean }
```

**方針**

- `CardTableProps` はタイトル・説明と rows・columns・showSource を持つ。

**処理・互換性の補足** Card のタイトル・説明と RowsTable のデータ・列設定を新部品の props に割り当てる。データの形の検証は既存の表バインディングに接続し、両部品の描画処理を共用する。

**変更コード案**

```tsx
// src/viewer/report/components/cardTable.tsx
type CardTableProps = {
    title: string;
    description?: string;
    rows: Row[];
    columns?: Column[] | null;
    showSource?: boolean;
};
function CardTable({ title, description, rows, columns, showSource }: CardTableProps) {
    return <ReportCard title={title} description={description}>
        <RowsTable rows={rows} columns={columns} showSource={showSource} />
    </ReportCard>;
}
// ReportCard が registry 内部にある場合は既存のカード描画を再利用できる形で公開する。
```

**確認ケース** 既存2部品を組み合わせた表示と、単一部品での見出し、列、比較表示、空データを照合する。

<a id="implementation-detail-117"></a>

## 117. 部品の説明を日本語でも出す

**解決したい問題** MCP 上で部品や props の意味を日本語で確認したい。

**現行コード** catalog.ts の説明と llmCatalog.ts、docs/catalog/generate.ts における生成処理は、主に単一の説明文字列を使う。

**主な修正先** [`src/report/catalog.ts`](../../src/report/catalog.ts)、[`src/report/llmCatalog.ts`](../../src/report/llmCatalog.ts)、[`docs/catalog/generate.ts`](../../docs/catalog/generate.ts)

**コード修正案** 部品名や props キーは既存のまま、説明だけを言語別に解決する。生成側とMCPの案内で同じ選択関数を使い、未翻訳は現在の説明を返す。

### 関数・型の変更一覧

#### 既存関数 `buildReportCatalog`

**引数・戻り値**

```text
buildReportCatalog(locale?: CatalogLocale): ReportCatalog
```

**方針**

- `buildReportCatalog`、`componentMarkdown`、MCP のカタログ出力へ言語を渡す。
- CLIからの既定は既存説明と互換にする。

#### 既存関数 `componentMarkdown`

**引数・戻り値**

```text
componentMarkdown(component: ComponentEntry): string
```

**方針**

- `buildReportCatalog`、`componentMarkdown`、MCP のカタログ出力へ言語を渡す。

#### 既存型 `ComponentEntry`

**属性・型**

```text
ComponentEntry { description: string; localizedDescription?: LocalizedDescription }
```

**方針**

- `ComponentEntry` とカタログ側の属性説明の定義に任意の翻訳を加える。
- 生成する単一言語のカタログ形式は維持する。

#### 新規関数 `descriptionFor`

**引数・戻り値**

```text
descriptionFor(description: LocalizedDescription, locale: CatalogLocale): string
```

**方針**

- `descriptionFor(description, locale)` は選択言語の説明を返し、なければ既定言語を返す。

#### 新規型 `CatalogLocale`

**属性・型**

```text
CatalogLocale = 'en' | 'ja'
```

**方針**

- `CatalogLocale` は en/ja、`LocalizedDescription` は既定説明と任意の日本語説明。

#### 新規型 `LocalizedDescription`

**属性・型**

```text
LocalizedDescription { en: string; ja?: string }
```

**方針**

- `CatalogLocale` は en/ja、`LocalizedDescription` は既定説明と任意の日本語説明。

**処理・互換性の補足** 部品説明と props 説明の定義に日本語を追加し、既存英語と同じキーで言語を選ぶ。カタログ生成とMCPで同じ出力処理を使い、翻訳のない説明は既定言語を使う。

**変更コード案**

```ts
// src/report/catalog.ts + llmCatalog.ts
type CatalogLocale = 'en' | 'ja';
type LocalizedDescription = { en: string; ja?: string };
function descriptionFor(description: LocalizedDescription, locale: CatalogLocale): string {
    return description[locale] ?? description.en;
}
// 英語のみの description は移行中に { en: description } として扱う。
// MCP、Markdown、JSONの生成がこの関数を共用する。
```

**確認ケース** 部品と props のどちらかだけ翻訳がある場合、英語の既存カタログ、生成物を比較する。

<a id="implementation-detail-118"></a>

## 118. 印刷・PDF と静的な HTML

**解決したい問題** レポートをPDFで共有し、ネット接続なしでも表や図を見られるHTMLを渡したい。

**現行コード** writeReportHtml は viewer のHTMLへシリアライズした report を埋め込む。印刷ページの区切りや、スクリプト実行を必要としない出力の契約は別途必要。

**主な修正先** [`src/builder/reportBuilder.ts`](../../src/builder/reportBuilder.ts)、[`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/viewer/report/view.tsx`](../../src/viewer/report/view.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/cli/index.ts`](../../src/cli/index.ts)

**新規パス候補** `src/builder/export/staticHtml.ts`

**コード修正案** 印刷用スタイルで操作部・表の改ページを調整する。静的出力は解決後のレポートから文章・表と対応できる図を合成し、図の画像化・参照先・サポート対象を定義する。

### 関数・型の変更一覧

#### 既存関数 `writeReportHtml`

**引数・戻り値**

```text
writeReportHtml(report: EmbeddedReport, outputPath: string, templatePath?: string, mode?: ReportOutputMode): Promise<string>
```

**方針**

- `writeReportHtml` と `writeReportSite` が出力方式に応じて通常ビューまたは静的生成へ振り分ける。
- 印刷は既存ビューのCSSを拡張する。

#### 既存関数 `writeReportSite`

**引数・戻り値**

```text
writeReportSite(resolved: { report: EmbeddedReport; pages?: { file: string; report: EmbeddedReport }[] }, outputPath: string, templatePath?: string, mode?: ReportOutputMode): Promise<string>
```

**方針**

- `writeReportHtml` と `writeReportSite` が出力方式に応じて通常ビューまたは静的生成へ振り分ける。

#### 既存型の直接変更なし

**方針**

- 既存 `EmbeddedReport` は維持する。出力方式は書出しの任意オプションで指定し、現行呼び出しの引数順を壊さない。

#### 新規関数 `renderStaticHtml`

**引数・戻り値**

```text
renderStaticHtml(report: EmbeddedReport, pages: readonly SplitPage[], assets: StaticAssets): string
```

**方針**

- `renderStaticHtml(report, pages, assets)` は解決済み文章・表・図資材をHTMLにする。
- 印刷CSSの適用は既存のビューに留める。

#### 新規型 `ReportOutputMode`

**属性・型**

```text
ReportOutputMode = 'html' | 'staticHtml'
```

**方針**

- `ReportOutputMode` は通常HTML／静的HTMLを表す設定。

#### 新規型 `StaticAssets`

**属性・型**

```text
StaticAssets { styles: string; images: ReadonlyMap<string, string> }
```

**方針**

- `StaticAssets` は出力に必要な画像・スタイルを束ねる案。

**処理・互換性の補足** 印刷時は操作部を抑え、表ヘッダーとページ区切りのCSSを定義する。静的HTMLは解決済みの層から文章、表、図を出せる範囲を決め、画像とスタイルを成果物に含める。

**変更コード案**

```css
/* src/viewer/report/styles.css + src/builder/export/staticHtml.ts */
@media print {
    .report-toolbar { display: none; }
    .report-table thead { display: table-header-group; }
    .report-table tr { break-inside: avoid; }
    .report-page-break { break-before: page; }
}
/* staticHtml.ts の入口は EmbeddedReport とページ一覧を受け、
   解決済みの表・本文・図資材からネット接続不要のHTMLを生成する。 */
```

**確認ケース** 印刷プレビュー／PDFとオフラインHTMLで、表の途中改ページとページ参照を確認する。

<a id="implementation-detail-119"></a>

## 119. 文書の中の検索

**解決したい問題** クラスページが多数あっても、文書全体から「一括更新」が現れる見出しや文を探したい。

**現行コード** RowsTable は表単体でセル検索を行う。別ページのタイトル・文章を含む索引は埋め込み形式にない。

**主な修正先** [`src/viewer/report/view.tsx`](../../src/viewer/report/view.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)、[`src/builder/pages.ts`](../../src/builder/pages.ts)、[`src/report/embedding.ts`](../../src/report/embedding.ts)

**新規パス候補** `src/viewer/report/components/reportSearch.tsx`

**コード修正案** 展開済みの spec から表示するタイトルと文章を抽出し、pageId と anchor を付ける。viewer は検索結果のページを開いた後、アンカーへ移動する。

### 関数・型の変更一覧

#### 既存関数 `splitPages`

**引数・戻り値**

```text
splitPages(spec: Spec, state: State): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] }
```

**方針**

- `splitPages` の出力ページを索引化に使い、`ReportView` に検索UIと移動処理を追加する。

#### 既存関数 `ReportView`

**引数・戻り値**

```text
ReportView(props: { report: EmbeddedReport }): ReactElement
```

**方針**

- `splitPages` の出力ページを索引化に使い、`ReportView` に検索UIと移動処理を追加する。

#### 既存型 `EmbeddedReport`

**属性・型**

```text
EmbeddedReport { searchIndex?: readonly SearchEntry[] }
```

**方針**

- `EmbeddedReport` に任意の検索索引または参照を加える。
- 旧HTMLの読取は索引なしで続ける。

#### 新規関数 `buildReportSearchIndex`

**引数・戻り値**

```text
buildReportSearchIndex(pages: readonly SplitPage[]): SearchEntry[]
```

**方針**

- `buildReportSearchIndex(pages)` は見出し・本文を抽出する。

#### 新規関数 `searchReport`

**引数・戻り値**

```text
searchReport(entries: readonly SearchEntry[], query: string): SearchEntry[]
```

**方針**

- `searchReport(entries, query)` は正規化済み文字列で一致を探す。

#### 新規型 `SearchEntry`

**属性・型**

```text
SearchEntry { pageId: string; anchor: string; title: string; text: string }
```

**方針**

- `SearchEntry` は pageId、anchor、title、text。
- 表示用本文だけを保持する。

**処理・互換性の補足** 生成済みページごとに見出しと表示対象のテキスト、ページID、アンカーを抽出する。viewer は索引から一致を検索し、ページ切替後に対象へ移動する。

**変更コード案**

```ts
// src/builder/pages.ts + src/viewer/report/components/reportSearch.tsx
type SearchEntry = { pageId: string; anchor: string; title: string; text: string };
function searchReport(entries: readonly SearchEntry[], query: string): SearchEntry[] {
    const needle = query.normalize().trim().toLocaleLowerCase('ja');
    if (!needle) return [];
    return entries.filter(({ title, text }) =>
        (title + ' ' + text).normalize().toLocaleLowerCase('ja').includes(needle)
    );
}
// 索引は描画用の見出しと文章から作り、埋め込みデータを丸ごと索引に入れない。
```

**確認ケース** 別ページの一致、同語の複数箇所、日本語、結果0件を確認する。

<a id="implementation-detail-120"></a>

## 120. 見た目の調整

**解決したい問題** 組織ごとに表紙の見出し、ロゴ、アクセント色を変えたい。

**現行コード** ReportDocument は文書の配置とデータを表す。viewer が文書単位で読み取る theme 契約がない。

**主な修正先** [`src/report/document.ts`](../../src/report/document.ts)、[`src/report/documentSchema.ts`](../../src/report/documentSchema.ts)、[`src/report/embedding.ts`](../../src/report/embedding.ts)、[`src/viewer/report/view.tsx`](../../src/viewer/report/view.tsx)、[`src/viewer/report/styles.css`](../../src/viewer/report/styles.css)

**コード修正案** 任意の theme 型を定義して JSON Schema と埋め込み形式へ通す。色は検証後 CSS 変数へ、表紙は既存カード構造へ、ロゴは既存の画像の制約で解決する。

### 関数・型の変更一覧

#### 既存関数 `resolveReport`

**引数・戻り値**

```text
resolveReport(document: unknown, input: ReportInput, options?: ResolveReportOptions): ResolvedReport
```

**方針**

- `resolveReport` は検証済みtheme設定を埋め込み出力へ渡す。

#### 既存関数 `ReportView`

**引数・戻り値**

```text
ReportView(props: { report: EmbeddedReport }): ReactElement
```

**方針**

- `ReportView` はアクセントCSSとロゴ・表紙を適用する。

#### 既存関数 `buildDocumentJsonSchema`

**引数・戻り値**

```text
buildDocumentJsonSchema(): JsonSchema
```

**方針**

- `resolveReport` は検証済みtheme設定を埋め込み出力へ渡す。

#### 既存型 `ReportDocument`

**属性・型**

```text
ReportDocument { theme?: ReportTheme }
```

**方針**

- `ReportDocument` と `EmbeddedReport` に任意の theme を追加し、`buildDocumentJsonSchema` にも反映する。

#### 既存型 `EmbeddedReport`

**属性・型**

```text
EmbeddedReport { theme?: ReportTheme }
```

**方針**

- `ReportDocument` と `EmbeddedReport` に任意の theme を追加し、`buildDocumentJsonSchema` にも反映する。

#### 新規関数 `themeStyle`

**引数・戻り値**

```text
themeStyle(theme: ReportTheme | undefined): { '--report-accent'?: string }
```

**方針**

- `themeStyle(theme)` は有効なアクセント色を CSS 変数へ変換する。
- 既存の画像描画・カード描画へロゴと表紙の値を渡す。

#### 新規型 `ReportTheme`

**属性・型**

```text
ReportTheme { accent?: string; logo?: { src: string; alt: string }; cover?: { title: string; subtitle?: string } }
```

**方針**

- `ReportTheme` は accent・logo(src/alt)・cover(title/subtitle) の任意スキーマ。

**処理・互換性の補足** 設定は文書の任意ブロックとして定義する。色は CSS 変数、ロゴは画像参照、表紙は既存部品の構成に反映し、検証と生成スキーマで有効な値を揃える。

**変更コード案**

```ts
// src/report/document.ts + src/viewer/report/view.tsx
const ReportTheme = z.object({
    accent: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    logo: z.object({ src: z.string(), alt: z.string() }).optional(),
    cover: z.object({ title: z.string(), subtitle: z.string().optional() }).optional(),
}).strict();
const themeStyle = (theme: z.infer<typeof ReportTheme> | undefined) =>
    theme?.accent ? { '--report-accent': theme.accent } : {};
// theme は任意の文書属性として登録し、ロゴ参照を既存の画像解決規則で検証する。
```

**確認ケース** 無指定の既存文書、色だけ指定、ロゴ欠落、表紙付き複数ページを確認する。
