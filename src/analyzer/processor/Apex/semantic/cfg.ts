import type {
    ApexNodeJson,
    BaseExpressionJson,
    ConvertKeys,
    ForStatementJson,
    StatementJson,
} from '../../../types';
import { childNodesOf } from '../../commons/node';
import type { ApexBodyStatementJson, ApexExecutableBody } from './declaration';

// 実行本体の制御フローグラフ (CFG。値の解析用。docs/plan.md 10 章 P4 段 2「CFG」・docs/plan-details.md C-1)。
// 表示用の処理フロー (report/apexFlow.ts。複数の文を 1 つの箱にまとめる) とは別に、評価の順の「評価点」と辺を持つ。
//
// - 評価点: 文 1 つ (statement)、条件の評価 (condition)、ループの頭 (loop)、catch・finally の入口、
//   式の中の分岐の合流 (expression。短絡の && / || と三項演算子)。分岐のない式は、文の評価点がまとめて表す
// - 辺: normal・true・false・loopBack・exception・return・break・continue・case (switch の when へ)
// - 例外: try の中の文・条件から catch へ (catch がなければ finally へ)。throw は、いちばん内側の受け手へ
//   (受け手がなければ出口へ)。try の外の文の例外 (呼び出しが投げるものなど) は辺にしない
// - finally: 入ってくる経路 (通常・例外・return) を 1 つの評価点にまとめ、出たあとは入ってきた経路の先すべてへ進む
//   (値の解析では安全側になる近似)。break・continue は finally を通さず、ループへ直接つなぐ

export type ApexCfgNodeKind =
    'entry' | 'exit' | 'statement' | 'condition' | 'expression' | 'loop' | 'catch' | 'finally';

export type ApexCfgNode = {
    /** 評価点の ID (役割と、元のノードの sourceKey) */
    id: string;
    kind: ApexCfgNodeKind;
    /** 元のノードの位置 (入口・出口はなし) */
    sourceKeys?: ConvertKeys;
    /** 元のノードの kind (文の種類・式の種類) */
    nodeKind?: string;
    /** この評価点で評価する式 (条件・式の分岐の合流) */
    expression?: BaseExpressionJson;
    /**
     * この評価点で評価する JSON の部分 (文の中の式・変数の宣言など。入れ子の文は含まない)。
     * 変数の定義・読みを評価点に対応させるのに使う (dataflow.ts)
     */
    parts?: readonly unknown[];
};

export type ApexCfgEdgeKind =
    | 'normal'
    | 'true'
    | 'false'
    | 'loopBack'
    | 'exception'
    | 'return'
    | 'break'
    | 'continue'
    | 'case';

export type ApexCfgEdge = { from: string; to: string; kind: ApexCfgEdgeKind };

export type ApexCfg = {
    bodyId: string;
    entry: string;
    exit: string;
    nodes: ReadonlyMap<string, ApexCfgNode>;
    edges: readonly ApexCfgEdge[];
    /** 評価点から出ていく辺 */
    successors: (id: string) => readonly ApexCfgEdge[];
    /** 評価点へ入ってくる辺 */
    predecessors: (id: string) => readonly ApexCfgEdge[];
};

/** まだ行き先の決まらない辺 (評価点と辺の種類) */
type Pending = { from: string; kind: ApexCfgEdgeKind };

/** ループの文脈 (break の行き先を集め、continue の行き先を持つ) */
type LoopContext = { breaks: Pending[]; continueTo: string };

/** try の文脈 (例外の行き先と、finally を通る return があったか) */
type TryContext = {
    /** 例外の行き先 (catch の入口。catch がなければ finally) */
    handlers: string[];
    /** finally の入口 (なければ undefined) */
    finally?: string;
    routedReturn: boolean;
    routedException: boolean;
};

type Context = { loops: LoopContext[]; tries: TryContext[] };

const isBranching = (expression: BaseExpressionJson): boolean =>
    expression.kind === 'logical' || expression.kind === 'conditional';

/** 式の中に分岐 (短絡・三項) があるか */
const containsBranching = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(containsBranching);
    if (typeof value !== 'object' || value === null) return false;
    if (isBranching(value as BaseExpressionJson)) return true;
    return childNodesOf(value as ApexNodeJson).some(containsBranching);
};

/** 実行本体の CFG */
export const apexCfgOf = (body: ApexExecutableBody): ApexCfg => {
    const nodes = new Map<string, ApexCfgNode>();
    const edges: ApexCfgEdge[] = [];
    const entry = 'entry';
    const exit = 'exit';
    nodes.set(entry, { id: entry, kind: 'entry' });
    nodes.set(exit, { id: exit, kind: 'exit' });

    const addNode = (
        kind: ApexCfgNodeKind,
        source: { kind: string; sourceKeys: ConvertKeys } | undefined,
        expression?: BaseExpressionJson,
        parts?: readonly unknown[],
    ): string => {
        const base = `${kind}:${source?.sourceKeys.sourceKey ?? nodes.size}`;
        let id = base;
        for (let n = 2; nodes.has(id); n++) id = `${base}#${n}`;
        nodes.set(id, {
            id,
            kind,
            ...(source ? { sourceKeys: source.sourceKeys, nodeKind: source.kind } : {}),
            ...(expression ? { expression } : {}),
            ...(parts ? { parts } : expression ? { parts: [expression] } : {}),
        });
        return id;
    };
    const connect = (from: readonly Pending[], to: string) => {
        for (const pending of from) edges.push({ from: pending.from, to, kind: pending.kind });
    };
    const normal = (id: string): Pending[] => [{ from: id, kind: 'normal' }];
    /** ループの本体の終わりから頭へ戻る辺 (通常の終わりは loopBack にする) */
    const asLoopBack = (pendings: Pending[]): Pending[] =>
        pendings.map((p) => ({ ...p, kind: p.kind === 'normal' ? 'loopBack' : p.kind }));

    /** 例外の行き先へつなぐ (try の中だけ) */
    const mayThrow = (id: string, context: Context) => {
        const inner = context.tries[context.tries.length - 1];
        if (!inner) return;
        inner.routedException = true;
        for (const handler of inner.handlers)
            edges.push({ from: id, to: handler, kind: 'exception' });
    };

    // -----------------------------------------------------------------------
    // 式
    // -----------------------------------------------------------------------

    /** 式を評価する (分岐のある式だけ評価点を作る。なければ preds をそのまま返す) */
    const evaluate = (
        expression: BaseExpressionJson | undefined,
        preds: Pending[],
        context: Context,
    ): Pending[] => {
        if (!expression || !containsBranching(expression)) return preds;
        if (
            expression.kind === 'logical' &&
            (expression.operator === '&&' || expression.operator === '||')
        ) {
            const left = condition(expression.left, preds, context);
            const and = expression.operator === '&&';
            const right = evaluate(expression.right, and ? left.whenTrue : left.whenFalse, context);
            const join = addNode('expression', expression, expression);
            connect([...right, ...(and ? left.whenFalse : left.whenTrue)], join);
            return normal(join);
        }
        if (expression.kind === 'conditional') {
            const test = condition(expression.condition, preds, context);
            const whenTrue = evaluate(expression.trueValue, test.whenTrue, context);
            const whenFalse = evaluate(expression.falseValue, test.whenFalse, context);
            const join = addNode('expression', expression, expression);
            connect([...whenTrue, ...whenFalse], join);
            return normal(join);
        }
        // 分岐を含む子の式を、書いた順に評価する (評価点はその子の分岐だけ)
        let current = preds;
        for (const child of childNodesOf(expression as ApexNodeJson)) {
            current = evaluate(child as BaseExpressionJson, current, context);
        }
        return current;
    };

    /** 条件を評価する (短絡は、真・偽の行き先を左右の条件に分ける) */
    const condition = (
        expression: BaseExpressionJson,
        preds: Pending[],
        context: Context,
    ): { whenTrue: Pending[]; whenFalse: Pending[] } => {
        if (
            expression.kind === 'logical' &&
            (expression.operator === '&&' || expression.operator === '||')
        ) {
            const left = condition(expression.left, preds, context);
            if (expression.operator === '&&') {
                const right = condition(expression.right, left.whenTrue, context);
                return {
                    whenTrue: right.whenTrue,
                    whenFalse: [...left.whenFalse, ...right.whenFalse],
                };
            }
            const right = condition(expression.right, left.whenFalse, context);
            return { whenTrue: [...left.whenTrue, ...right.whenTrue], whenFalse: right.whenFalse };
        }
        const evaluated = evaluate(expression, preds, context);
        const id = addNode('condition', expression, expression);
        connect(evaluated, id);
        mayThrow(id, context);
        return { whenTrue: [{ from: id, kind: 'true' }], whenFalse: [{ from: id, kind: 'false' }] };
    };

    /** 文の中の式をすべて評価してから、文の評価点を置く */
    const simple = (
        statement: { kind: string; sourceKeys: ConvertKeys },
        expressions: readonly (BaseExpressionJson | undefined)[],
        preds: Pending[],
        context: Context,
        /** 評価点の部分 (省略すれば expressions) */
        parts: readonly unknown[] = expressions,
    ): string => {
        let current = preds;
        for (const expression of expressions) current = evaluate(expression, current, context);
        const id = addNode('statement', statement, undefined, parts);
        connect(current, id);
        mayThrow(id, context);
        return id;
    };

    /** 文の中の式 (分岐を探すために、子のノードを式として並べる) */
    const expressionsOf = (statement: { kind: string }): BaseExpressionJson[] =>
        childNodesOf(statement as ApexNodeJson) as BaseExpressionJson[];

    // -----------------------------------------------------------------------
    // 文
    // -----------------------------------------------------------------------

    const block = (
        statements: readonly ApexBodyStatementJson[],
        preds: Pending[],
        context: Context,
    ) => {
        let current = preds;
        for (const statement of statements) current = build(statement, current, context);
        return current;
    };

    /** return・throw の行き先 (finally があれば finally を通す) */
    const jumpOut = (from: string, kind: 'return' | 'exception', context: Context) => {
        if (kind === 'exception') {
            const inner = context.tries[context.tries.length - 1];
            if (inner) {
                inner.routedException = true;
                for (const handler of inner.handlers) edges.push({ from, to: handler, kind });
                return;
            }
            edges.push({ from, to: exit, kind });
            return;
        }
        const withFinally = [...context.tries].reverse().find((t) => t.finally);
        if (withFinally?.finally) {
            withFinally.routedReturn = true;
            edges.push({ from, to: withFinally.finally, kind });
            return;
        }
        edges.push({ from, to: exit, kind });
    };

    const loop = (
        statement: { kind: string; sourceKeys: ConvertKeys },
        preds: Pending[],
        context: Context,
        makeBody: (head: string, loopContext: LoopContext, inner: Context) => Pending[],
    ): Pending[] => {
        const head = addNode('loop', statement);
        connect(preds, head);
        const loopContext: LoopContext = { breaks: [], continueTo: head };
        const exits = makeBody(head, loopContext, {
            ...context,
            loops: [...context.loops, loopContext],
        });
        return [...exits, ...loopContext.breaks];
    };

    const build = (
        statement: ApexBodyStatementJson,
        preds: Pending[],
        context: Context,
    ): Pending[] => {
        const s = statement as StatementJson;
        switch (s.kind) {
            case 'blockStatement':
            case 'runAs':
                return block(
                    s.block,
                    s.kind === 'runAs' ? evaluateAll(s.arg, preds, context) : preds,
                    context,
                );
            case 'if': {
                let current = preds;
                const exits: Pending[] = [];
                let hasElse = false;
                for (const branch of s.conditionBlock) {
                    if (branch.condition === 'else') {
                        exits.push(...block(branch.block, current, context));
                        hasElse = true;
                        break;
                    }
                    const test = condition(branch.condition, current, context);
                    exits.push(...block(branch.block, test.whenTrue, context));
                    current = test.whenFalse;
                }
                if (!hasElse) exits.push(...current);
                return exits;
            }
            case 'while':
                return loop(s, preds, context, (head, _loopContext, inner) => {
                    const test = condition(s.condition, normal(head), inner);
                    connect(asLoopBack(block(s.block, test.whenTrue, inner)), head);
                    return test.whenFalse;
                });
            case 'doWhile':
                return loop(s, preds, context, (head, loopContext, inner) => {
                    // 本体が先。continue は条件へ
                    const testEntry = addNode('statement', {
                        kind: 'doWhileTest',
                        sourceKeys: s.sourceKeys,
                    });
                    loopContext.continueTo = testEntry;
                    const body = block(s.block, normal(head), inner);
                    connect(body, testEntry);
                    const test = condition(s.condition, normal(testEntry), inner);
                    connect(
                        test.whenTrue.map((p) => ({ ...p, kind: 'loopBack' })),
                        head,
                    );
                    return test.whenFalse;
                });
            case 'for':
                return forStatement(s, preds, context);
            case 'forEach': {
                const evaluated = evaluate(s.right, preds, context);
                return loop(s, evaluated, context, (head, _loopContext, inner) => {
                    // 頭は「次の要素があるか」の分岐 (真で本体、偽で抜ける)
                    connect(
                        asLoopBack(block(s.block, [{ from: head, kind: 'true' }], inner)),
                        head,
                    );
                    return [{ from: head, kind: 'false' }];
                });
            }
            case 'switch': {
                // when の条件 (型付きの when の変数の定義) も、この評価点で評価するものとして持つ
                const value = simple(s, [s.value], preds, context, [
                    s.value,
                    ...s.when.map((w) => w.condition),
                ]);
                const exits: Pending[] = [];
                let hasElse = false;
                for (const when of s.when) {
                    if (when.condition.condition === 'else') hasElse = true;
                    exits.push(...block(when.block, [{ from: value, kind: 'case' }], context));
                }
                if (!hasElse) exits.push({ from: value, kind: 'false' });
                return exits;
            }
            case 'try':
                return tryStatement(s.block, preds, context);
            case 'return': {
                const id = simple(s, [s.field], preds, context);
                jumpOut(id, 'return', context);
                return [];
            }
            case 'throw': {
                // 例外の辺は jumpOut だけで引く (simple の mayThrow と重ねない)
                const id = addNode('statement', s, undefined, [s.value]);
                connect(evaluate(s.value, preds, context), id);
                jumpOut(id, 'exception', context);
                return [];
            }
            case 'break': {
                const id = simple(s, [], preds, context);
                const target = context.loops[context.loops.length - 1];
                if (target) target.breaks.push({ from: id, kind: 'break' });
                return [];
            }
            case 'continue': {
                const id = simple(s, [], preds, context);
                const target = context.loops[context.loops.length - 1];
                if (target) edges.push({ from: id, to: target.continueTo, kind: 'continue' });
                return [];
            }
            default:
                // 式文・変数の宣言・DML・フィールドの初期値など: 中の式を評価してから文
                return normal(
                    simple(
                        s as { kind: string; sourceKeys: ConvertKeys },
                        expressionsOf(s),
                        preds,
                        context,
                    ),
                );
        }
    };

    const evaluateAll = (
        expressions: readonly BaseExpressionJson[],
        preds: Pending[],
        context: Context,
    ) => {
        let current = preds;
        for (const expression of expressions) current = evaluate(expression, current, context);
        return current;
    };

    const forStatement = (s: ForStatementJson, preds: Pending[], context: Context): Pending[] => {
        const control = s.condition;
        // 初期化 (変数の宣言か、式の並び)
        let current = preds;
        if (control.initializer) {
            const init = Array.isArray(control.initializer)
                ? control.initializer
                : expressionsOf(control.initializer);
            current = normal(
                simple({ kind: 'forInit', sourceKeys: control.sourceKeys }, init, current, context),
            );
        }
        return loop(s, current, context, (head, loopContext, inner) => {
            const test = control.condition
                ? condition(control.condition, normal(head), inner)
                : { whenTrue: normal(head), whenFalse: [] as Pending[] };
            // 更新式 (continue は更新式へ)
            const update = addNode(
                'statement',
                { kind: 'forUpdate', sourceKeys: control.sourceKeys },
                undefined,
                control.update ?? [],
            );
            loopContext.continueTo = update;
            const body = block(s.block, test.whenTrue, inner);
            connect(body, update);
            const updated = evaluateAll(control.update ?? [], normal(update), inner);
            connect(
                updated.map((p) => ({ ...p, kind: 'loopBack' })),
                head,
            );
            return test.whenFalse;
        });
    };

    const tryStatement = (
        clauses: Extract<StatementJson, { kind: 'try' }>['block'],
        preds: Pending[],
        context: Context,
    ): Pending[] => {
        const tryClause = clauses.find((c) => c.condition === 'try');
        const catches = clauses.filter((c) => c.condition === 'catch');
        const finallyClause = clauses.find((c) => c.condition === 'finally');
        const finallyId = finallyClause ? addNode('finally', finallyClause) : undefined;
        const catchIds = catches.map((c) => addNode('catch', c));
        const tryContext: TryContext = {
            handlers: catchIds.length ? catchIds : finallyId ? [finallyId] : [],
            ...(finallyId ? { finally: finallyId } : {}),
            routedReturn: false,
            routedException: false,
        };
        const exits = block(tryClause?.block ?? [], preds, {
            ...context,
            tries: [...context.tries, tryContext],
        });
        // catch の中の例外・return は、finally (あれば) か外側へ
        const catchContext: TryContext | undefined = finallyId
            ? {
                  handlers: [finallyId],
                  finally: finallyId,
                  routedReturn: false,
                  routedException: false,
              }
            : undefined;
        catches.forEach((clause, index) => {
            const inner = catchContext
                ? { ...context, tries: [...context.tries, catchContext] }
                : context;
            exits.push(...block(clause.block, normal(catchIds[index]!), inner));
        });
        if (!finallyId || !finallyClause) return exits;
        connect(exits, finallyId);
        const after = block(finallyClause.block, normal(finallyId), context);
        // finally を出たあと: 入ってきた経路の先すべてへ (近似)
        const routedReturn = tryContext.routedReturn || catchContext?.routedReturn;
        const routedException =
            (tryContext.routedException && !catchIds.length) || catchContext?.routedException;
        for (const end of after) {
            if (routedReturn) jumpOut(end.from, 'return', context);
            if (routedException) jumpOut(end.from, 'exception', context);
        }
        return exits.length ? after : [];
    };

    const ends = block(body.statements, normal(entry), { loops: [], tries: [] });
    connect(ends, exit);

    const outgoing = new Map<string, ApexCfgEdge[]>();
    const incoming = new Map<string, ApexCfgEdge[]>();
    for (const edge of edges) {
        (outgoing.get(edge.from) ?? outgoing.set(edge.from, []).get(edge.from)!).push(edge);
        (incoming.get(edge.to) ?? incoming.set(edge.to, []).get(edge.to)!).push(edge);
    }
    return {
        bodyId: body.id,
        entry,
        exit,
        nodes,
        edges,
        successors: (id) => outgoing.get(id) ?? [],
        predecessors: (id) => incoming.get(id) ?? [],
    };
};

/** 入口から辿れる評価点 (届かない文の判定に使う) */
export const reachableApexCfgNodes = (cfg: ApexCfg): Set<string> => {
    const seen = new Set<string>([cfg.entry]);
    const stack = [cfg.entry];
    while (stack.length) {
        for (const edge of cfg.successors(stack.pop()!)) {
            if (seen.has(edge.to)) continue;
            seen.add(edge.to);
            stack.push(edge.to);
        }
    }
    return seen;
};
