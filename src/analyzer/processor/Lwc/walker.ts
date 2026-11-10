import type {
    LwcBodyContentJson,
    LwcClassJson,
    LwcComponentJson,
    LwcDecoratorJson,
    LwcDeclarationJson,
    LwcExportJson,
    LwcImportJson,
    LwcImportSpecifierJson,
    LwcJsExpressionJson,
    LwcJsObjectMethodJson,
    LwcJsPatternJson,
    LwcJsPatternPropertyJson,
    LwcJsPrivateNameJson,
    LwcJsPropertyJson,
    LwcJsSpreadJson,
    LwcJsStatementJson,
    LwcJsVariantJson,
    LwcMemberJson,
    LwcModuleJson,
    LwcParameterJson,
    LwcTypeDeclarationJson,
    LwcTypeJson,
    LwcWireConfigJson,
} from '../../types';

// LWC の JS / TS の JSON の走査 (docs/lwc-json-types.md 6 章の段階 6・8.8)。
// Apex の解析の walker (docs/apex-json-analysis.md 2.1) と同じ形: kind ごとの処理 (Visitor) を登録して JSON を 1 回だけたどる。
// - 文・式はすべて kind を持つ (7 章の 3) ので、Apex の getExpressionLabel のような形からの種類分けは要らない
// - kind を持たない入れ物 (if の分岐・try の節・switch の case・修飾子・関数の中身など) は中に入るだけ
// - 型 (lwcType) の中には入らない (中身は kind を持たない)
// - 解析は 1 つの時点の JSON だけを入力にする (Diff に依存しない)。結果には元のノードの sourceKeys を持たせる

/** 走査で訪問するノード (kind を持つもの) */
export type LwcWalkNode =
    | LwcJsExpressionJson
    | LwcJsStatementJson
    | Exclude<LwcJsPatternJson, LwcJsExpressionJson>
    | LwcJsVariantJson
    | LwcJsPropertyJson
    | LwcJsObjectMethodJson
    | LwcJsSpreadJson
    | LwcJsPatternPropertyJson
    | LwcJsPrivateNameJson
    | LwcMemberJson
    | LwcParameterJson
    | LwcDecoratorJson
    | LwcWireConfigJson
    | LwcComponentJson
    | LwcClassJson
    | LwcDeclarationJson
    | LwcExportJson
    | LwcImportJson
    | LwcImportSpecifierJson
    | LwcTypeDeclarationJson
    | LwcTypeJson;

export type LwcWalkKind = LwcWalkNode['kind'];

/** 走査中の文脈 (Apex の walker の context。docs/apex-json-analysis.md 2.2) */
export type LwcWalkContext = {
    /** 今いるモジュールの直下のもの (コンポーネント・クラス・宣言)。直下の文は持たない */
    owner?: { kind: 'lwcComponent' | 'lwcClass' | 'lwcDeclaration'; name: string };
    /** 今いるメンバーの名前 (いちばん外側のもの。static ブロックは 'static') */
    member?: string;
    /** 入れ子の関数 (コールバック・ハンドラー) の深さ。メンバー・宣言の本体の直下は 0 */
    functionDepth: number;
    /** for / while / do の入れ子の深さ (関数の境界で 0 に戻す) */
    loopDepth: number;
    /** if / for / while / try / switch の入れ子の深さ (関数の境界で 0 に戻す) */
    nestingDepth: number;
    /** try の節の中か (catch・finally の節は含めない。関数の境界で false に戻す) */
    inTry: boolean;
};

/** kind ごとの処理。false を返すとそのノードの中に入らない */
export type LwcVisitor = {
    [K in LwcWalkKind]?: (
        node: Extract<LwcWalkNode, { kind: K }>,
        context: LwcWalkContext,
    ) => void | boolean;
};

export const initialLwcWalkContext = (): LwcWalkContext => ({
    functionDepth: 0,
    loopDepth: 0,
    nestingDepth: 0,
    inTry: false,
});

/** 複数の Visitor を 1 つにする (1 回の走査で複数の解析をする。どれかが false を返せば中に入らない) */
export const composeLwcVisitors = (...visitors: LwcVisitor[]): LwcVisitor => {
    const composed: Record<string, (node: never, context: LwcWalkContext) => boolean | void> = {};
    const kinds = new Set(visitors.flatMap((visitor) => Object.keys(visitor)));
    for (const kind of kinds) {
        const handlers = visitors.flatMap((visitor) => {
            const handler = (visitor as Record<string, unknown>)[kind];
            return typeof handler === 'function'
                ? [handler as (node: never, context: LwcWalkContext) => boolean | void]
                : [];
        });
        composed[kind] = (node, context) => {
            let enter = true;
            for (const handler of handlers) if (handler(node, context) === false) enter = false;
            return enter;
        };
    }
    return composed as LwcVisitor;
};

const MEMBER_KINDS = new Set([
    'lwcField',
    'lwcProperty',
    'lwcMethod',
    'lwcConstructor',
    'lwcStaticBlock',
]);
const LOOP_KINDS = new Set(['jsFor', 'jsForIn', 'jsForOf', 'jsWhile', 'jsDoWhile']);
const NESTING_KINDS = new Set([...LOOP_KINDS, 'jsIf', 'jsSwitch', 'jsTry']);
const FUNCTION_KINDS = new Set(['jsFunction', 'jsObjectMethod', 'jsFunctionDeclaration']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** ノードに入るときの文脈 */
const enterContext = (node: Record<string, unknown>, context: LwcWalkContext): LwcWalkContext => {
    const kind = node.kind as string;
    if (
        (kind === 'lwcComponent' || kind === 'lwcClass' || kind === 'lwcDeclaration') &&
        !context.owner
    ) {
        const name = typeof node.name === 'string' ? node.name : 'default';
        return { ...context, owner: { kind, name } };
    }
    if (MEMBER_KINDS.has(kind) && context.member === undefined) {
        return {
            ...context,
            member: kind === 'lwcStaticBlock' ? 'static' : String(node.name),
        };
    }
    if (FUNCTION_KINDS.has(kind)) {
        // 入れ子の関数は呼ばれる場所が別なので、ループ・try の文脈を持ち込まない
        return {
            ...context,
            functionDepth: context.functionDepth + 1,
            loopDepth: 0,
            nestingDepth: 0,
            inTry: false,
        };
    }
    if (NESTING_KINDS.has(kind)) {
        return {
            ...context,
            loopDepth: context.loopDepth + (LOOP_KINDS.has(kind) ? 1 : 0),
            nestingDepth: context.nestingDepth + 1,
        };
    }
    return context;
};

/** JSON の部分木を走査する (前順。kind を持つノードごとに visitor を呼ぶ) */
export const walkLwcJson = (
    root: unknown,
    visitor: LwcVisitor,
    context: LwcWalkContext = initialLwcWalkContext(),
): void => {
    const walk = (value: unknown, current: LwcWalkContext): void => {
        if (Array.isArray(value)) {
            value.forEach((item) => walk(item, current));
            return;
        }
        if (!isRecord(value)) return;
        let next = current;
        if (typeof value.kind === 'string') {
            const handler = (visitor as Record<string, unknown>)[value.kind];
            if (
                typeof handler === 'function' &&
                (handler as (node: unknown, context: LwcWalkContext) => boolean | void)(
                    value,
                    current,
                ) === false
            ) {
                return;
            }
            // 型の中身は kind を持たない
            if (value.kind === 'lwcType') return;
            next = enterContext(value, current);
            if (value.kind === 'jsTry') {
                // try の節だけ inTry にする
                for (const clause of value.block as { condition: string }[]) {
                    walk(clause, { ...next, inTry: clause.condition === 'try' || next.inTry });
                }
                return;
            }
        }
        for (const [key, child] of Object.entries(value)) {
            if (key !== 'sourceKeys') walk(child, next);
        }
    };
    walk(root, context);
};

/** 本体の中身 (文の並びと、アロー関数の式の本体) を走査する。引数・修飾子には入らない */
export const walkLwcBodyContent = (
    content: LwcBodyContentJson & { expression?: LwcJsExpressionJson },
    visitor: LwcVisitor,
    context: LwcWalkContext = initialLwcWalkContext(),
): void => {
    if (content.block) walkLwcJson(content.block, visitor, context);
    if (content.expression) walkLwcJson(content.expression, visitor, context);
};

/** モジュール全体を走査する (import・コンポーネント・export・宣言・型の宣言・直下の文の順) */
export const walkLwcModuleJson = (
    module: LwcModuleJson,
    visitor: LwcVisitor,
    context: LwcWalkContext = initialLwcWalkContext(),
): void => {
    walkLwcJson(module.imports, visitor, context);
    if (module.component) walkLwcJson(module.component, visitor, context);
    walkLwcJson(module.exports, visitor, context);
    walkLwcJson(module.declarations, visitor, context);
    if (module.typeDeclarations) walkLwcJson(module.typeDeclarations, visitor, context);
    if (module.statements) walkLwcJson(module.statements, visitor, context);
};

// ---------------------------------------------------------------------------
// 式の部品 (解析で共通に使う)
// ---------------------------------------------------------------------------

/** 式を包むもの (括弧・as・!・型引数) を外した中の式 (types/lwc/commons.ts の unwrapExpression と同じ考え方) */
export const unwrapLwcExpression = (node: LwcJsExpressionJson): LwcJsExpressionJson => {
    let current = node;
    while (
        current.kind === 'jsParenthesized' ||
        current.kind === 'jsTypeCast' ||
        current.kind === 'jsNonNull' ||
        current.kind === 'jsInstantiation'
    ) {
        current = current.expression;
    }
    return current;
};

/** 文字列のリテラル ('x'・式のないテンプレートリテラル `x`) の値。それ以外は null */
export const lwcStringValueOf = (
    node: LwcJsExpressionJson | LwcJsSpreadJson | null | undefined,
) => {
    if (!node || node.kind === 'jsSpread') return null;
    const target = unwrapLwcExpression(node);
    if (target.kind === 'jsString') return target.value;
    if (target.kind === 'jsTemplate' && target.expressions.length === 0)
        return target.quasis[0] ?? null;
    return null;
};

/**
 * 名前の並びで書いた式 (識別子・this・メンバーの参照の連なり) の名前 (this.template・a.b.c)。
 * ソースの文字列ではなく構造から作る。名前の並びでなければ null
 */
export const lwcDottedNameOf = (node: LwcJsExpressionJson): string | null => {
    const target = unwrapLwcExpression(node);
    switch (target.kind) {
        case 'jsIdentifier':
            return target.name;
        case 'jsThis':
            return 'this';
        case 'jsSuper':
            return 'super';
        case 'jsMemberAccess': {
            if (target.type !== 'object') return null;
            const object = lwcDottedNameOf(target.object);
            const member = target.member ?? lwcStringValueOf(target.computed);
            return object !== null && member !== null ? `${object}.${member}` : null;
        }
        default:
            return null;
    }
};

/** オブジェクトのプロパティの名前 (計算されたキーは文字列のリテラルのときだけ) */
export const lwcPropertyKeyOf = (property: { key?: string; computed?: LwcJsExpressionJson }) =>
    property.key ?? lwcStringValueOf(property.computed);

/** オブジェクトの式の key: value のプロパティ (メソッド・スプレッドは除く)。オブジェクトでなければ空 */
export const lwcObjectPropertiesOf = (
    node: LwcJsExpressionJson | LwcJsSpreadJson | null | undefined,
): Map<string, LwcJsExpressionJson> => {
    const properties = new Map<string, LwcJsExpressionJson>();
    if (!node || node.kind === 'jsSpread') return properties;
    const target = unwrapLwcExpression(node);
    if (target.kind !== 'jsObject') return properties;
    for (const property of target.properties) {
        if (property.kind !== 'jsProperty') continue;
        const key = lwcPropertyKeyOf(property);
        if (key !== null && !properties.has(key)) properties.set(key, property.value);
    }
    return properties;
};

/**
 * コンポーネントの継承元とミックスイン (extends NavigationMixin(LightningElement) なら
 * extend: 'LightningElement'、mixins: ['NavigationMixin'])。名前の並びで書いていないものは null
 */
export const lwcHeritageOf = (
    superClass: LwcJsExpressionJson | undefined,
): { extend?: string | null; mixins: (string | null)[] } => {
    if (!superClass) return { mixins: [] };
    const mixins: (string | null)[] = [];
    let current = unwrapLwcExpression(superClass);
    // Mixin(Base) は jsCall、ns.Mixin(Base) は jsMemberAccess (type: 'method')
    while (
        current.kind === 'jsCall' ||
        (current.kind === 'jsMemberAccess' && current.type === 'method')
    ) {
        let args;
        if (current.kind === 'jsCall') {
            mixins.push(lwcDottedNameOf(current.callee));
            args = current.arg;
        } else {
            const object = lwcDottedNameOf(current.object);
            mixins.push(object !== null && current.member ? `${object}.${current.member}` : null);
            args = current.memberArg ?? [];
        }
        const [inner] = args;
        if (!inner || inner.kind === 'jsSpread') return { mixins };
        current = unwrapLwcExpression(inner);
    }
    return { extend: lwcDottedNameOf(current), mixins };
};
