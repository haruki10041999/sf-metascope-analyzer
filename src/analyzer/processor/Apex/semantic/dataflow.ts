import type { BaseExpressionJson } from '../../../types';
import { type ApexCfg, apexCfgOf, reachableApexCfgNodes } from './cfg';
import type { ApexExecutableBody } from './declaration';
import type { ApexDefinition, ApexVariableAccess } from './statement';

// 実行本体の値の解析 (到達定義と定数伝播。docs/plan.md 10 章 P4 段 2「スコープと値の追跡」「分岐と終了」
// 「ループと例外の経路」「到達定義・定数伝播」・docs/plan-details.md C-2〜C-5)。
// 入力は CFG (cfg.ts) と、statement.ts の変数の定義 (ApexDefinition) と読み (ApexVariableAccess)。
//
// - 定義・読みを評価点に結ぶ: 評価点を作った順に、自分の位置と部分 (parts) の中のノードの位置を、まだ持ち主の
//   ない位置の持ち主にする (式の分岐の合流など、内側の評価点が先に作られるので、内側が取る)。引数の定義は入口
// - 到達定義: 前向きの解析。合流で和集合、ループは変わらなくなるまで回す (ワークリスト)。定義は同じ変数の前の定義を
//   消す。例外の辺は、評価点の前と後の両方の定義を流す (評価の途中で投げうるので、安全側)
// - 値: 読みに届く定義の値がすべて同じ定数なら定数、違う・分からないものがあれば unknown (理由つき)。
//   分かる値は、リテラル・変数 (届く定義の値)・括弧・三項・+ (文字列の連結と数の足し算)・- * (数)。
//   複合代入 (+=)・増減 (++)・引数・for-each / catch / when の変数・呼び出しの結果は unknown。
//   初期値のない変数の宣言は null (Apex の決まり)

export type ApexValue =
    | { kind: 'constant'; value: string | number | boolean | null }
    | { kind: 'unknown'; reason: string };

export type ApexDataflow = {
    cfg: ApexCfg;
    /** 位置 (sourceKey) を持つ評価点 */
    nodeOf: (sourceKey: string) => string | undefined;
    /** 読みに届きうる定義 (届かない読みは空) */
    reachingDefinitions: (access: ApexVariableAccess) => ApexDefinition[];
    /** 読みの値 */
    valueOf: (access: ApexVariableAccess) => ApexValue;
    /** 定義が与える値 */
    valueOfDefinition: (definition: ApexDefinition) => ApexValue;
    /**
     * 式の文字列の形 (分かる文字と、分からない穴の並び)。+ の連結・変数 (届く定義が 1 つか、どれも同じ形のとき)・
     * += の連結をたどる。動的 SOQL の復元 (dynamicQuery.ts) に使う
     */
    segmentsOf: (expression: BaseExpressionJson) => ApexStringSegment[];
};

/** 文字列の形の 1 つ (分かる文字か、分からない穴と理由) */
export type ApexStringSegment = { text: string } | { hole: string };

/** 隣り合う文字をつなぐ */
const joinSegments = (segments: readonly ApexStringSegment[]): ApexStringSegment[] => {
    const result: ApexStringSegment[] = [];
    for (const segment of segments) {
        const last = result[result.length - 1];
        if ('text' in segment && last && 'text' in last)
            result[result.length - 1] = { text: last.text + segment.text };
        else result.push(segment);
    }
    return result;
};

/** 定義の ID (宣言・位置・種類) */
const definitionIdOf = (definition: ApexDefinition) =>
    `${definition.declarationId}@${definition.sourceKeys.sourceKey}#${definition.kind}`;

const unknown = (reason: string): ApexValue => ({ kind: 'unknown', reason });

/** 状態: 変数の宣言の ID → 届く定義の ID */
type State = Map<string, ReadonlySet<string>>;

const union = (states: readonly State[]): State => {
    const result: State = new Map();
    for (const state of states) {
        for (const [declaration, definitions] of state) {
            const merged = new Set(result.get(declaration) ?? []);
            for (const definition of definitions) merged.add(definition);
            result.set(declaration, merged);
        }
    }
    return result;
};

const sameState = (a: State, b: State) =>
    a.size === b.size &&
    [...a].every(([key, set]) => {
        const other = b.get(key);
        return (
            other !== undefined && other.size === set.size && [...set].every((d) => other.has(d))
        );
    });

/** JSON の中の位置 (sourceKey) をすべて集める */
const sourceKeysIn = (value: unknown, out: string[] = []): string[] => {
    if (Array.isArray(value)) {
        for (const item of value) sourceKeysIn(item, out);
    } else if (typeof value === 'object' && value !== null) {
        const keys = (value as { sourceKeys?: { sourceKey?: unknown } }).sourceKeys;
        if (typeof keys?.sourceKey === 'string') out.push(keys.sourceKey);
        for (const [key, child] of Object.entries(value))
            if (key !== 'sourceKeys') sourceKeysIn(child, out);
    }
    return out;
};

const literalValueOf = (expression: BaseExpressionJson): ApexValue | undefined => {
    const node = expression as { kind: string; value?: unknown };
    switch (node.kind) {
        case 'integer':
        case 'long':
        case 'decimal':
            return { kind: 'constant', value: Number(String(node.value).replace(/[lL]$/, '')) };
        case 'string':
            return { kind: 'constant', value: String(node.value) };
        case 'boolean':
            return { kind: 'constant', value: node.value === true };
        case 'null':
            return { kind: 'constant', value: null };
        default:
            return undefined;
    }
};

export const apexDataflowOf = (
    analysis: {
        body: ApexExecutableBody;
        accesses: readonly ApexVariableAccess[];
        definitions: readonly ApexDefinition[];
    },
    cfg: ApexCfg = apexCfgOf(analysis.body),
): ApexDataflow => {
    // 1. 位置 → 評価点 (作った順に、まだ持ち主のない位置を取る)
    const owner = new Map<string, string>();
    for (const node of cfg.nodes.values()) {
        const keys = [
            ...(node.sourceKeys ? [node.sourceKeys.sourceKey] : []),
            ...sourceKeysIn(node.parts ?? []),
        ];
        for (const key of keys) if (!owner.has(key)) owner.set(key, node.id);
    }
    const nodeOfDefinition = (definition: ApexDefinition) =>
        definition.kind === 'parameter' ? cfg.entry : owner.get(definition.sourceKeys.sourceKey);

    // 2. 評価点ごとの定義 (実行の順)
    const definitionsAt = new Map<string, ApexDefinition[]>();
    const byId = new Map<string, ApexDefinition>();
    for (const definition of [...analysis.definitions].sort((a, b) => a.order - b.order)) {
        byId.set(definitionIdOf(definition), definition);
        const node = nodeOfDefinition(definition);
        if (!node) continue;
        (definitionsAt.get(node) ?? definitionsAt.set(node, []).get(node)!).push(definition);
    }
    const transfer = (state: State, node: string, beforeOrder = Infinity): State => {
        const next: State = new Map(state);
        for (const definition of definitionsAt.get(node) ?? []) {
            if (definition.order >= beforeOrder) break;
            next.set(definition.declarationId, new Set([definitionIdOf(definition)]));
        }
        return next;
    };

    // 3. 到達定義 (ワークリスト)
    const inState = new Map<string, State>();
    const outState = new Map<string, State>();
    const reachable = reachableApexCfgNodes(cfg);
    const work = [...reachable];
    while (work.length) {
        const node = work.shift()!;
        const incoming = cfg.predecessors(node).map((edge) => {
            const out = outState.get(edge.from) ?? new Map();
            // 例外の辺: 評価の途中で投げうるので、評価点の前と後の両方
            return edge.kind === 'exception'
                ? union([inState.get(edge.from) ?? new Map(), out])
                : out;
        });
        const before = union(incoming);
        const after = transfer(before, node);
        inState.set(node, before);
        const previous = outState.get(node);
        if (previous && sameState(previous, after)) continue;
        outState.set(node, after);
        for (const edge of cfg.successors(node)) if (!work.includes(edge.to)) work.push(edge.to);
    }

    const accessByKey = new Map(analysis.accesses.map((a) => [a.sourceKeys.sourceKey, a]));

    const reachingDefinitions = (access: ApexVariableAccess): ApexDefinition[] => {
        if (access.target.kind !== 'variable') return [];
        const node = owner.get(access.sourceKeys.sourceKey);
        if (!node || !reachable.has(node)) return [];
        // 同じ評価点の中の、読みより前の定義も効かせる
        const state = transfer(inState.get(node) ?? new Map(), node, access.order);
        return [...(state.get(access.target.declarationId) ?? [])].flatMap((id) => {
            const definition = byId.get(id);
            return definition ? [definition] : [];
        });
    };

    // 4. 値
    const visiting = new Set<string>();
    const valueOfDefinition = (definition: ApexDefinition): ApexValue => {
        switch (definition.kind) {
            case 'parameter':
            case 'loopVariable':
            case 'catchVariable':
            case 'whenVariable':
                return unknown(definition.kind);
            case 'compoundAssignment':
            case 'increment':
                return unknown('compound');
        }
        if (!definition.value) return { kind: 'constant', value: null };
        const id = definitionIdOf(definition);
        if (visiting.has(id)) return unknown('cycle');
        visiting.add(id);
        try {
            return valueOfExpression(definition.value);
        } finally {
            visiting.delete(id);
        }
    };

    const valueOf = (access: ApexVariableAccess): ApexValue => {
        if (access.target.kind !== 'variable') return unknown(access.target.kind);
        const node = owner.get(access.sourceKeys.sourceKey);
        if (!node || !reachable.has(node)) return unknown('unreachable');
        const definitions = reachingDefinitions(access);
        if (!definitions.length) return unknown('noDefinition');
        return mergeValues(definitions.map(valueOfDefinition), 'branches');
    };

    const valueOfExpression = (expression: BaseExpressionJson): ApexValue => {
        const literal = literalValueOf(expression);
        if (literal) return literal;
        const node = expression as BaseExpressionJson & Record<string, unknown>;
        switch (node.kind) {
            case 'identifier': {
                const access = accessByKey.get(node.sourceKeys.sourceKey);
                return access ? valueOf(access) : unknown('notVariable');
            }
            case 'parenthesized':
                return valueOfExpression(node.expression as BaseExpressionJson);
            case 'conditional': {
                const test = valueOfExpression(node.condition as BaseExpressionJson);
                const whenTrue = valueOfExpression(node.trueValue as BaseExpressionJson);
                const whenFalse = valueOfExpression(node.falseValue as BaseExpressionJson);
                if (test.kind === 'constant' && typeof test.value === 'boolean')
                    return test.value ? whenTrue : whenFalse;
                return mergeValues([whenTrue, whenFalse], 'branches');
            }
            case 'unary': {
                // x++ / x-- (後ろ) は増減する前の値、++x / --x (前) は増減したあとの値
                const argument = valueOfExpression(node.argument as BaseExpressionJson);
                if (argument.kind !== 'constant') return argument;
                const value = argument.value;
                switch (node.operator) {
                    case '++':
                    case '--':
                        if (typeof value !== 'number') return unknown('unary');
                        return node.operatorLocation === 'back'
                            ? argument
                            : {
                                  kind: 'constant',
                                  value: value + (node.operator === '++' ? 1 : -1),
                              };
                    case '-':
                        return typeof value === 'number'
                            ? { kind: 'constant', value: -value }
                            : unknown('unary');
                    case '!':
                        return typeof value === 'boolean'
                            ? { kind: 'constant', value: !value }
                            : unknown('unary');
                    default:
                        return unknown('unary');
                }
            }
            case 'binary': {
                const left = valueOfExpression(node.left as BaseExpressionJson);
                const right = valueOfExpression(node.right as BaseExpressionJson);
                if (left.kind !== 'constant') return left;
                if (right.kind !== 'constant') return right;
                return binaryValueOf(String(node.operator), left.value, right.value);
            }
            default:
                return unknown(node.kind);
        }
    };

    // 5. 文字列の形 (動的 SOQL の復元)
    const segmentVisiting = new Set<string>();
    const segmentsOfDefinition = (definition: ApexDefinition): ApexStringSegment[] => {
        const id = definitionIdOf(definition);
        if (segmentVisiting.has(id)) return [{ hole: 'cycle' }];
        segmentVisiting.add(id);
        try {
            switch (definition.kind) {
                case 'initializer':
                case 'assignment':
                    return definition.value ? segmentsOf(definition.value) : [{ text: 'null' }];
                case 'compoundAssignment': {
                    // q += '...' は、前の値のあとに右辺をつなぐ (文字列の += だけを考える)
                    const before = previousRead(definition);
                    if (!before || !definition.value) return [{ hole: 'compound' }];
                    return joinSegments([
                        ...segmentsOfAccess(before),
                        ...segmentsOf(definition.value),
                    ]);
                }
                default:
                    return [{ hole: definition.kind }];
            }
        } finally {
            segmentVisiting.delete(id);
        }
    };
    /** 複合代入の左辺の読み (同じ変数の readWrite で、定義の順までのいちばん後のもの) */
    const previousRead = (definition: ApexDefinition): ApexVariableAccess | undefined =>
        analysis.accesses
            .filter(
                (a) =>
                    a.access === 'readWrite' &&
                    a.target.kind === 'variable' &&
                    a.target.declarationId === definition.declarationId &&
                    a.order <= definition.order,
            )
            .sort((a, b) => b.order - a.order)[0];
    const segmentsOfAccess = (access: ApexVariableAccess): ApexStringSegment[] => {
        if (access.target.kind !== 'variable') return [{ hole: access.target.kind }];
        const definitions = reachingDefinitions(access);
        if (!definitions.length) return [{ hole: 'noDefinition' }];
        const forms = definitions.map(segmentsOfDefinition);
        const first = JSON.stringify(forms[0]);
        return forms.every((form) => JSON.stringify(form) === first)
            ? forms[0]!
            : [{ hole: 'branches' }];
    };
    const segmentsOf = (expression: BaseExpressionJson): ApexStringSegment[] => {
        const literal = literalValueOf(expression);
        if (literal?.kind === 'constant') return [{ text: String(literal.value) }];
        const node = expression as BaseExpressionJson & Record<string, unknown>;
        switch (node.kind) {
            case 'parenthesized':
                return segmentsOf(node.expression as BaseExpressionJson);
            case 'binary':
                if (node.operator !== '+') return [{ hole: 'binary' }];
                return joinSegments([
                    ...segmentsOf(node.left as BaseExpressionJson),
                    ...segmentsOf(node.right as BaseExpressionJson),
                ]);
            case 'identifier': {
                const access = accessByKey.get(node.sourceKeys.sourceKey);
                return access ? segmentsOfAccess(access) : [{ hole: 'notVariable' }];
            }
            default:
                return [{ hole: node.kind }];
        }
    };

    return {
        cfg,
        nodeOf: (sourceKey) => owner.get(sourceKey),
        reachingDefinitions,
        valueOf,
        valueOfDefinition,
        segmentsOf,
    };
};

/** いくつかの値を 1 つにする (すべて同じ定数なら定数、ほかは unknown) */
const mergeValues = (values: readonly ApexValue[], reason: string): ApexValue => {
    const first = values[0];
    if (!first) return unknown(reason);
    if (first.kind === 'unknown') return first;
    for (const value of values.slice(1)) {
        if (value.kind === 'unknown') return value;
        if (value.value !== first.value) return unknown(reason);
    }
    return first;
};

const binaryValueOf = (
    operator: string,
    left: string | number | boolean | null,
    right: string | number | boolean | null,
): ApexValue => {
    if (operator === '+') {
        if (typeof left === 'string' || typeof right === 'string')
            return { kind: 'constant', value: `${String(left)}${String(right)}` };
        if (typeof left === 'number' && typeof right === 'number')
            return { kind: 'constant', value: left + right };
    }
    if (typeof left === 'number' && typeof right === 'number') {
        if (operator === '-') return { kind: 'constant', value: left - right };
        if (operator === '*') return { kind: 'constant', value: left * right };
    }
    return unknown(`operator${operator}`);
};
