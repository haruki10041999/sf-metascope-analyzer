import type { CodeFlowEdge, CodeFlowNode } from './types';

// 処理フロー (1 つの関数・メソッドの中の流れ) を作る、言語に依らない部分 (docs/todo.md 3.2.1 の 4)。
// 言語ごとに「文を分類する関数」(StatementClassifier) を用意すれば、Apex と LWC (JS) で同じ図になる。
// - 続く処理 (分岐・繰り返し・データの操作などを含まない文) は 1 つの箱にまとめる
// - if / else if は分岐の箱を並べ、switch は 1 つの分岐の箱から節ごとに分かれる
// - 繰り返しは頭の箱に戻る線 (back) と、終わりの線を持つ。break は繰り返しの後へ、continue は頭へ
// - try は catch へ「例外」の線、finally は try・catch のあと。return・throw は終了へ

/** 文の分類 (言語ごとの classifier が返す) */
export type ClassifiedStatement<S> =
    | {
          type: 'simple';
          /** process はまとめてよい処理。query / dml / callout / event / call は 1 文ずつ箱にする */
          kind: 'process' | 'query' | 'dml' | 'callout' | 'event' | 'call' | 'navigate';
          text: string;
          line?: number | undefined;
      }
    | { type: 'if'; branches: { condition: string | null; body: S[]; line?: number | undefined }[] }
    | {
          type: 'switch';
          subject: string;
          line?: number | undefined;
          cases: { label: string; body: S[]; isElse: boolean }[];
      }
    | { type: 'loop'; header: string; body: S[]; line?: number | undefined }
    | {
          type: 'try';
          body: S[];
          catches: { label: string; body: S[] }[];
          finallyBody: S[] | null;
          line?: number | undefined;
      }
    | { type: 'return' | 'throw'; text: string; line?: number | undefined }
    | { type: 'break' | 'continue' }
    | { type: 'block'; body: S[] }
    /** 図に出さない文 (空の文・ローカルのクラス宣言など) */
    | { type: 'skip' };

export type StatementClassifier<S> = (statement: S) => ClassifiedStatement<S>;

/** 箱の文字の長さ (1 行) と、まとめた箱の行数 */
const LABEL_LENGTH = 60;
const MERGED_LINES = 3;
const DETAIL_LINES = 20;

/** 1 行目を、長ければ切る */
export const firstLine = (text: string): string => {
    const line = text.split('\n')[0]!.trim();
    return line.length > LABEL_LENGTH ? `${line.slice(0, LABEL_LENGTH - 1)}…` : line;
};

/** 詳しい文 (箱を押したときに出す)。長ければ切る */
const detailOf = (texts: string[]): string => {
    const lines = texts.join('\n').split('\n');
    return lines.length > DETAIL_LINES
        ? `${lines.slice(0, DETAIL_LINES).join('\n')}\n…`
        : lines.join('\n');
};

/** まだつないでいない線の始まり (前の箱と、線の種類・文字) */
type Exit = { from: string; kind: CodeFlowEdge['kind']; label?: string };

type LoopContext = { head: string; breaks: Exit[] };

/**
 * 関数の本体から処理フローの箱と線を作る。start・end の箱を持つ
 */
export const buildCodeFlow = <S>(
    title: string,
    body: S[],
    classify: StatementClassifier<S>,
): { nodes: CodeFlowNode[]; edges: CodeFlowEdge[] } => {
    const nodes: CodeFlowNode[] = [];
    const edges: CodeFlowEdge[] = [];
    let count = 0;
    const node = (properties: Omit<CodeFlowNode, 'id'>): string => {
        const id = `n${++count}`;
        nodes.push({ id, ...properties });
        return id;
    };
    const connect = (
        exits: Exit[],
        to: string,
        override?: { kind: Exit['kind']; label?: string | undefined },
    ) => {
        for (const exit of exits) {
            const kind = override?.kind ?? exit.kind;
            const label = override && 'label' in override ? override.label : exit.label;
            edges.push({ from: exit.from, to, kind, ...(label ? { label } : {}) });
        }
    };
    const lineOf = (line: number | undefined) => (line !== undefined ? { line } : {});

    const start = node({ kind: 'start', label: title });
    const end = node({ kind: 'end', label: '終了' });

    const build = (statements: S[], entries: Exit[], loops: LoopContext[]): Exit[] => {
        let exits = entries;
        /** まとめる途中の処理 */
        let pending: { text: string; line?: number | undefined }[] = [];
        const flush = () => {
            if (!pending.length) return;
            const labels = pending.map((p) => firstLine(p.text));
            const label =
                labels.length > MERGED_LINES
                    ? `${labels.slice(0, MERGED_LINES).join('\n')}\n… (ほか ${labels.length - MERGED_LINES} 文)`
                    : labels.join('\n');
            const id = node({
                kind: 'process',
                label,
                detail: detailOf(pending.map((p) => p.text)),
                ...lineOf(pending[0]!.line),
                ...(pending.length > 1 ? { count: pending.length } : {}),
            });
            connect(exits, id);
            exits = [{ from: id, kind: 'normal' }];
            pending = [];
        };
        const inLoop = loops.length > 0 ? { inLoop: true } : {};

        for (const statement of statements) {
            // return・throw・break のあとの文には届かない
            if (exits.length === 0 && pending.length === 0) break;
            const c = classify(statement);
            if (c.type === 'skip') continue;
            if (c.type === 'simple' && c.kind === 'process') {
                pending.push({ text: c.text, line: c.line });
                continue;
            }
            flush();
            switch (c.type) {
                case 'simple': {
                    const id = node({
                        kind: c.kind,
                        label: firstLine(c.text),
                        detail: detailOf([c.text]),
                        ...lineOf(c.line),
                        ...inLoop,
                    });
                    connect(exits, id);
                    exits = [{ from: id, kind: 'normal' }];
                    break;
                }
                case 'if': {
                    const out: Exit[] = [];
                    let rest = exits;
                    for (const branch of c.branches) {
                        if (branch.condition === null) {
                            out.push(...build(branch.body, rest, loops));
                            rest = [];
                            continue;
                        }
                        const id = node({
                            kind: 'decision',
                            label: firstLine(branch.condition),
                            detail: detailOf([branch.condition]),
                            ...lineOf(branch.line),
                        });
                        connect(rest, id);
                        out.push(
                            ...build(
                                branch.body,
                                [{ from: id, kind: 'yes', label: 'はい' }],
                                loops,
                            ),
                        );
                        rest = [{ from: id, kind: 'no', label: 'いいえ' }];
                    }
                    exits = [...out, ...rest];
                    break;
                }
                case 'switch': {
                    const id = node({
                        kind: 'decision',
                        label: firstLine(c.subject),
                        detail: detailOf([c.subject]),
                        ...lineOf(c.line),
                    });
                    connect(exits, id);
                    const out: Exit[] = [];
                    for (const when of c.cases) {
                        out.push(
                            ...build(
                                when.body,
                                [{ from: id, kind: 'case', label: when.label }],
                                loops,
                            ),
                        );
                    }
                    if (!c.cases.some((when) => when.isElse)) {
                        out.push({ from: id, kind: 'case', label: 'その他' });
                    }
                    exits = out;
                    break;
                }
                case 'loop': {
                    const id = node({
                        kind: 'loop',
                        label: firstLine(c.header),
                        detail: detailOf([c.header]),
                        ...lineOf(c.line),
                        ...inLoop,
                    });
                    connect(exits, id);
                    const context: LoopContext = { head: id, breaks: [] };
                    const bodyExits = build(
                        c.body,
                        [{ from: id, kind: 'loop', label: '繰り返す' }],
                        [...loops, context],
                    );
                    connect(bodyExits, id, { kind: 'back', label: undefined });
                    exits = [{ from: id, kind: 'no', label: '終わり' }, ...context.breaks];
                    break;
                }
                case 'try': {
                    const id = node({ kind: 'try', label: 'try', ...lineOf(c.line) });
                    connect(exits, id);
                    const out = build(c.body, [{ from: id, kind: 'normal' }], loops);
                    for (const handler of c.catches) {
                        const catchId = node({ kind: 'catch', label: firstLine(handler.label) });
                        edges.push({ from: id, to: catchId, kind: 'exception', label: '例外' });
                        out.push(
                            ...build(handler.body, [{ from: catchId, kind: 'normal' }], loops),
                        );
                    }
                    if (c.finallyBody) {
                        const finallyId = node({ kind: 'finally', label: 'finally' });
                        connect(out, finallyId);
                        exits = build(c.finallyBody, [{ from: finallyId, kind: 'normal' }], loops);
                    } else {
                        exits = out;
                    }
                    break;
                }
                case 'return':
                case 'throw': {
                    const id = node({
                        kind: c.type,
                        label: firstLine(c.text),
                        detail: detailOf([c.text]),
                        ...lineOf(c.line),
                    });
                    connect(exits, id);
                    edges.push({
                        from: id,
                        to: end,
                        kind: c.type === 'throw' ? 'exception' : 'normal',
                        ...(c.type === 'throw' ? { label: '例外' } : {}),
                    });
                    exits = [];
                    break;
                }
                case 'break': {
                    const loop = loops[loops.length - 1];
                    // switch の中の break など、繰り返しの外の break はそのまま続ける
                    if (!loop) break;
                    loop.breaks.push(...exits);
                    exits = [];
                    break;
                }
                case 'continue': {
                    const loop = loops[loops.length - 1];
                    if (!loop) break;
                    connect(exits, loop.head, { kind: 'back', label: undefined });
                    exits = [];
                    break;
                }
                case 'block':
                    exits = build(c.body, exits, loops);
                    break;
            }
        }
        flush();
        return exits;
    };

    connect(build(body, [{ from: start, kind: 'normal' }], []), end);
    return { nodes, edges };
};
