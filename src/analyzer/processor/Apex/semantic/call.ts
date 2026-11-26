import type {
    ApexNodeJson,
    BaseExpressionJson,
    CallJson,
    ConvertKeys,
    TypeJson,
} from '../../../types';
import { walkJson } from '../../commons/node';
import type { ApexBodyAnalysis, ApexNameTarget } from './statement';

// ---------------------------------------------------------------------------
// 呼び出しの位置の収集 (docs/plan.md 10 章 P2)。
// 名前の並びだけでなく、レシーバーと引数の式そのものと、その構造 (ApexExpressionRef) を持つ。
// 識別子の解決先は semantic/statement.ts の結果 (ApexBodyAnalysis) から引く
// ---------------------------------------------------------------------------

/**
 * 式の構造 (レシーバー・引数の型の解決の入力)。
 * 括弧は外す。名前にできない式も途切れさせず、種類と元の式を持つ
 */
export type ApexExpressionRef =
    /** 識別子 (変数・メンバー・型名・名前空間など。target は statement.ts の解決先) */
    | { kind: 'name'; name: string; target: ApexNameTarget }
    | { kind: 'this' }
    | { kind: 'super' }
    /** フィールド・プロパティの参照 `x.a` (x が型名なら静的なメンバー) */
    | { kind: 'member'; object: ApexExpressionRef; member: string; safeNavigation: boolean }
    /** 呼び出しの結果 (callId は呼び出しの位置の ID) */
    | { kind: 'call'; callId: string }
    /** 添字 `x[i]` */
    | { kind: 'index'; object: ApexExpressionRef; index: BaseExpressionJson }
    /** `new T(...)` の結果 (callId は new の呼び出しの位置の ID) */
    | { kind: 'new'; type: TypeJson; callId: string }
    /** キャスト `(T) x` */
    | { kind: 'cast'; type: TypeJson; expression: ApexExpressionRef }
    /** そのほかの式 (リテラル・SOQL・演算など) */
    | { kind: 'expression'; expression: BaseExpressionJson };

/** 呼び出しの位置 1 つ */
export type ApexCallSite = {
    /** 呼び出しの ID (呼び出しのノードの sourceKey) */
    id: string;
    bodyId: string;
    /**
     * - method: メソッドの呼び出し (`f()`・`x.f()`)
     * - constructor: `this(...)`・`super(...)`
     * - new: `new T(...)` (コレクションの初期化子 `new List<T>{...}` を含む)
     */
    kind: 'method' | 'constructor' | 'new';
    /** メソッド名 (constructor は 'this' / 'super'、new は空) */
    name: string;
    /** レシーバー (`f()`・`this(...)`・`new` は null) */
    receiver: ApexExpressionRef | null;
    /** new の型 */
    type?: TypeJson;
    /** 引数の式 (書いた順。new の初期化子の要素・キーと値も含む) */
    args: BaseExpressionJson[];
    /** 引数の式の構造 */
    argRefs: ApexExpressionRef[];
    /** `?.` で呼ぶか */
    safeNavigation: boolean;
    sourceKeys: ConvertKeys;
    /** 本体の中の呼び出しの順 (レシーバー・引数の中の呼び出しが先) */
    order: number;
    inLoop: boolean;
};

const LOOP_KINDS = new Set(['for', 'forEach', 'while', 'doWhile']);

/** 式の構造を作る関数。識別子の解決先は、実行本体の解析の結果から引く */
export const expressionRefResolverOf = (
    analysis: ApexBodyAnalysis,
): ((expression: BaseExpressionJson) => ApexExpressionRef) => {
    const targets = new Map(analysis.accesses.map((a) => [a.sourceKeys.sourceKey, a.target]));
    const refOf = (expression: BaseExpressionJson): ApexExpressionRef => {
        switch (expression.kind) {
            case 'identifier':
                return {
                    kind: 'name',
                    name: expression.name,
                    target: targets.get(expression.sourceKeys.sourceKey) ?? {
                        kind: 'unresolved',
                    },
                };
            case 'this':
            case 'super':
                return { kind: expression.kind };
            case 'parenthesized':
                return refOf(expression.expression);
            case 'memberAccess':
                return expression.type === 'method'
                    ? { kind: 'call', callId: expression.sourceKeys.sourceKey }
                    : {
                          kind: 'member',
                          object: refOf(expression.object),
                          member: expression.member,
                          safeNavigation: expression.operator === '?.',
                      };
            case 'call':
                return { kind: 'call', callId: expression.sourceKeys.sourceKey };
            case 'index':
                return { kind: 'index', object: refOf(expression.object), index: expression.index };
            case 'new':
                return {
                    kind: 'new',
                    type: expression.newType,
                    callId: expression.sourceKeys.sourceKey,
                };
            case 'cast':
                return {
                    kind: 'cast',
                    type: expression.convertType,
                    expression: refOf(expression.expression),
                };
            default:
                return { kind: 'expression', expression };
        }
    };
    return refOf;
};

/** 実行本体の中の呼び出しを、評価する順に集める */
export const apexCallsOf = (analysis: ApexBodyAnalysis): ApexCallSite[] => {
    const bodyId = analysis.body.id;
    const refOf = expressionRefResolverOf(analysis);
    const calls: ApexCallSite[] = [];
    let order = 0;
    let loopDepth = 0;

    const push = (
        node: ApexNodeJson,
        site: Pick<ApexCallSite, 'kind' | 'name' | 'receiver' | 'args' | 'safeNavigation'> & {
            type?: TypeJson;
        },
    ) =>
        calls.push({
            id: node.sourceKeys.sourceKey,
            bodyId,
            ...site,
            argRefs: site.args.map(refOf),
            sourceKeys: node.sourceKeys,
            order: order++,
            inLoop: loopDepth > 0,
        });

    for (const statement of analysis.body.statements) {
        walkJson<ApexNodeJson>(statement as ApexNodeJson, {
            enterAny: (node) => {
                if (LOOP_KINDS.has(node.kind)) loopDepth++;
            },
            leaveAny: (node) => {
                if (LOOP_KINDS.has(node.kind)) loopDepth--;
            },
            // 呼び出しは、レシーバー・引数を評価したあと (ノードを出るとき) に順を付ける
            leave: {
                memberAccess: (node) => {
                    if (node.type !== 'method') return;
                    push(node, {
                        kind: 'method',
                        name: node.member,
                        receiver: refOf(node.object),
                        args: node.memberArg ?? [],
                        safeNavigation: node.operator === '?.',
                    });
                },
                call: (node) => {
                    const callee = node.callee;
                    push(node, {
                        kind: callee.kind === 'identifier' ? 'method' : 'constructor',
                        name: callee.kind === 'identifier' ? callee.name : callee.kind,
                        receiver: null,
                        args: node.arg,
                        safeNavigation: false,
                    });
                },
                new: (node) => {
                    push(node, {
                        kind: 'new',
                        name: '',
                        type: node.newType,
                        receiver: null,
                        args: [
                            ...(node.arg ?? []),
                            ...(node.elements ?? []),
                            ...(node.entries ?? []).flatMap((entry) => [entry.key, entry.value]),
                            ...(node.size ? [node.size] : []),
                        ],
                        safeNavigation: false,
                    });
                },
            },
        });
    }

    return calls;
};

/**
 * 式の構造が名前だけでできていれば、その並び (`a.b.c` は ['a', 'b', 'c']、`this.x` は ['this', 'x'])。
 * 呼び出し・添字・new などを含めば undefined
 */
export const namePathOf = (ref: ApexExpressionRef): string[] | undefined => {
    switch (ref.kind) {
        case 'name':
            return [ref.name];
        case 'this':
        case 'super':
            return [ref.kind];
        case 'member': {
            const object = namePathOf(ref.object);
            return object ? [...object, ref.member] : undefined;
        }
        default:
            return undefined;
    }
};
