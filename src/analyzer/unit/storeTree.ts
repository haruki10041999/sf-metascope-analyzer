// 解析結果 (UnitParseResult) を、データベースの行 (根・ノード・位置) に分ける / 組み立て直す
// (docs/implementation-roadmap.md 5.2・5.3)。
// - ノード: JsonType (kind と sourceKeys) と StructureJsonType (sourceKeys が { base, name, ... }) を 1 行にする。
//   親の中身 (content) のその場所は {"$node": <番号>} にし、子の行には親の番号と、親の中の場所 (パス) を持つ
// - 位置: result.sourceObject は別の行 (sourceObject の 1 件 × 位置 1 つ)。context (ソースの文字列) は、
//   単位のファイルの中身を位置で切り出したものと同じなら持たない (ファイルのパスだけ持つ)

/** ノードの行 (番号は単位の中で 1 から) */
export type NodeRow = {
    nodeId: number;
    parentId: number | null;
    path: string;
    kind: string;
    objectKey: string | null;
    sourceKey: string | null;
    /** StructureJsonType の sourceKeys (JSON)。JsonType は null */
    structureKeys: string | null;
    /** kind・sourceKeys を除いた中身 (JSON。子のノードは {"$node": 番号}) */
    content: string;
    /**
     * ノードの sourceKey の最初の位置の行 (span の entry と position)。位置がなければ null。
     * 位置を探す索引 (span の source_key) を持たずに、主キーで引くため (find_nodes)
     */
    spanEntry: number | null;
    spanPosition: number | null;
};

/** sourceObject の位置 1 つ */
export type SourcePosition = {
    sourceKey: string;
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
    filePath?: string;
};

/** sourceObject の 1 件 */
export type SourceEntry = { objectKey: string; context: string; source: SourcePosition[] };

/** 位置の行 */
export type SpanRow = {
    entry: number;
    /** 位置の番号 (位置のない sourceObject は -1) */
    position: number;
    objectKey: string;
    sourceKey: string;
    /** context を切り出した単位のファイル (リポジトリからの相対パス)。切り出せなければ null */
    filePath: string | null;
    /** 切り出せなかったときの context。切り出せれば null */
    context: string | null;
    startOffset: number;
    startLine: number;
    startColumn: number;
    endOffset: number;
    endLine: number;
    endColumn: number;
    /** 位置の filePath (単位の中のファイル。なければ null) */
    positionFilePath: string | null;
};

/** 根の中の sourceObject の置き場の印 */
const SPANS_MARK = '$spans';
const NODE_MARK = '$node';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNode = (value: unknown): value is Record<string, unknown> & { kind: string } =>
    isRecord(value) && typeof value.kind === 'string' && isRecord(value.sourceKeys);

const isStructureKeys = (keys: Record<string, unknown>) => isRecord(keys.base);

/** 解析結果を、根・ノード・位置の行にする。files は単位のファイルの中身 (context を持たずに済ませるため) */
export const flattenUnit = (
    data: unknown,
    files: readonly { path: string; text: string }[] = [],
): { root: string; nodes: NodeRow[]; spans: SpanRow[] } => {
    const nodes: NodeRow[] = [];
    let nextId = 1;
    const flatten = (value: unknown, parentId: number | null, at: string): unknown => {
        if (Array.isArray(value))
            return value.map((item, i) => flatten(item, parentId, `${at}[${i}]`));
        if (!isRecord(value)) return value;
        if (isNode(value)) {
            const nodeId = nextId++;
            const { kind, sourceKeys, ...rest } = value;
            const content: Record<string, unknown> = {};
            for (const [key, child] of Object.entries(rest))
                content[key] = flatten(child, nodeId, `$.${key}`);
            const keys = sourceKeys as Record<string, unknown>;
            const structure = isStructureKeys(keys);
            const main = (structure ? keys.base : keys) as {
                objectKey?: unknown;
                sourceKey?: unknown;
            };
            nodes.push({
                nodeId,
                parentId,
                path: at,
                kind,
                objectKey: typeof main.objectKey === 'string' ? main.objectKey : null,
                sourceKey: typeof main.sourceKey === 'string' ? main.sourceKey : null,
                structureKeys: structure ? JSON.stringify(keys) : null,
                content: JSON.stringify(content),
                spanEntry: null,
                spanPosition: null,
            });
            // 子が先に行になるので、ここで番号順にそろえる必要はない (読むときは番号で引く)
            return { [NODE_MARK]: nodeId };
        }
        const out: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(value))
            out[key] = flatten(child, parentId, `${at}.${key}`);
        return out;
    };

    // result.sourceObject は位置の行にする
    let entries: SourceEntry[] | undefined;
    let target = data;
    if (isRecord(data) && isRecord(data.result) && Array.isArray(data.result.sourceObject)) {
        entries = data.result.sourceObject as SourceEntry[];
        target = { ...data, result: { ...data.result, sourceObject: { [SPANS_MARK]: true } } };
    }
    const root = JSON.stringify(flatten(target, null, '$'));

    const spans: SpanRow[] = [];
    (entries ?? []).forEach((entry, index) => {
        const first = entry.source[0];
        const file = first
            ? files.find(
                  (f) => f.text.slice(first.start.offset, first.end.offset) === entry.context,
              )
            : undefined;
        const base = {
            entry: index,
            objectKey: entry.objectKey,
            filePath: file ? file.path : null,
            context: file ? null : entry.context,
        };
        if (entry.source.length === 0) {
            spans.push({
                ...base,
                position: -1,
                sourceKey: '',
                startOffset: 0,
                startLine: 0,
                startColumn: 0,
                endOffset: 0,
                endLine: 0,
                endColumn: 0,
                positionFilePath: null,
            });
        }
        entry.source.forEach((position, i) =>
            spans.push({
                ...base,
                position: i,
                sourceKey: position.sourceKey,
                startOffset: position.start.offset,
                startLine: position.start.line,
                startColumn: position.start.column,
                endOffset: position.end.offset,
                endLine: position.end.line,
                endColumn: position.end.column,
                positionFilePath: position.filePath ?? null,
            }),
        );
    });
    // ノードの位置の行 (sourceKey の最初の位置)
    const firstSpan = new Map<string, SpanRow>();
    for (const span of spans) {
        if (span.position >= 0 && !firstSpan.has(span.sourceKey))
            firstSpan.set(span.sourceKey, span);
    }
    for (const node of nodes) {
        const span = node.sourceKey === null ? undefined : firstSpan.get(node.sourceKey);
        node.spanEntry = span ? span.entry : null;
        node.spanPosition = span ? span.position : null;
    }
    return { root, nodes, spans };
};

/** 行から解析結果を組み立て直す。fileText は単位のファイルの中身 (context を切り出す) */
export const rebuildUnit = (
    root: string,
    nodes: readonly Pick<
        NodeRow,
        'nodeId' | 'kind' | 'objectKey' | 'sourceKey' | 'structureKeys' | 'content'
    >[],
    spans: readonly SpanRow[],
    fileText: (path: string) => string | undefined,
): unknown => {
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    // JSON.parse で作ったばかりの値は、その場で書き換える (コピーを作らない。NPSP の 85 万ノードで効く)
    const build = (value: unknown): unknown => {
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) value[i] = build(value[i]);
            return value;
        }
        if (!isRecord(value)) return value;
        const mark = value[NODE_MARK];
        if (typeof mark === 'number' && Object.keys(value).length === 1) {
            const node = byId.get(mark);
            if (!node) throw new Error(`node ${String(mark)} がありません`);
            const sourceKeys = node.structureKeys
                ? JSON.parse(node.structureKeys)
                : { objectKey: node.objectKey, sourceKey: node.sourceKey };
            // kind・sourceKeys を先にする (保存する前と同じキーの並び)
            const out: Record<string, unknown> = { kind: node.kind, sourceKeys };
            const content = JSON.parse(node.content) as Record<string, unknown>;
            for (const key in content) out[key] = build(content[key]);
            return out;
        }
        if (value[SPANS_MARK] === true && Object.keys(value).length === 1) {
            return entriesOf(spans, fileText);
        }
        for (const key in value) value[key] = build(value[key]);
        return value;
    };
    return build(JSON.parse(root));
};

const entriesOf = (
    spans: readonly SpanRow[],
    fileText: (path: string) => string | undefined,
): SourceEntry[] => {
    const entries: SourceEntry[] = [];
    for (const span of spans) {
        let entry = entries[span.entry];
        if (!entry) {
            let context = span.context;
            if (context === null) {
                const text = span.filePath === null ? undefined : fileText(span.filePath);
                if (text === undefined) {
                    throw new Error(`ソースがありません: ${span.filePath ?? '(なし)'}`);
                }
                context = text.slice(span.startOffset, span.endOffset);
            }
            entry = { objectKey: span.objectKey, context, source: [] };
            entries[span.entry] = entry;
        }
        if (span.position >= 0) {
            const position: SourcePosition = {
                sourceKey: span.sourceKey,
                start: { offset: span.startOffset, line: span.startLine, column: span.startColumn },
                end: { offset: span.endOffset, line: span.endLine, column: span.endColumn },
            };
            if (span.positionFilePath !== null) position.filePath = span.positionFilePath;
            entry.source.push(position);
        }
    }
    return entries;
};
