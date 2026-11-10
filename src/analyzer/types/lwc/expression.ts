// JS / TS の式の JSON (docs/lwc-json-types.md 5.4・7 章)。
// 7 章で決めたこと: kind は js で始める (テンプレートの lwc* とぶつからない)、式はソースの文字列を持たず、
// すべて構造 (式の種類ごとの型) で表す、式の種類は kind で明示する。
// - どの式も kind と sourceKeys (位置) を持つ。Diff の単位 (境界ノード) にするのは、Apex の memberAccess に当たる
//   jsMemberAccess・jsCall だけ (段階 4 の GumTree で使う)。ほかの式は Apex の「位置だけ」の式 (ExpressionValueKeys) と
//   同じ扱いで、親の値の一部として比べる (kind を持つので、値の比較 (getValueKey) は objectKey (中身のハッシュ) で行う)
// - 括弧は Apex の SubJson と同じく残す (jsParenthesized)。x! (jsNonNull)・x as T など (jsTypeCast) も残す
// - 型 (x as T・<T>x・satisfies・型引数・Flow の (x: T)) は type.ts の makeLwcTypeJson で JSON にする
// - 関数の本体のブロックは、メソッドと同じく文の並び (block: LwcJsStatementJson[]。statement.ts) で持つ (段階 4)
// - クラス式のメンバーは、コンポーネントと同じ LwcMemberJson で持つ (段階 5)
// - 今の構文解析のプラグイン (typescript・decorators・flow) では作られない式 (JSX・提案段階の構文) は jsUnsupported
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、JSON にもエラーのノードはない
import { makeJsonType, type JsonType } from '../commons/json';
import type { commons as ir, standardizedVisitor } from '../lwc_IR';

import { nameOf, type LwcJsonContext, type LwcNode } from './commons';
import {
    makeLwcClassMembersJson,
    makeLwcParameterJson,
    type LwcImportTables,
    type LwcMemberJson,
    type LwcParameterJson,
    type LwcParameterNode,
} from './component';
import { makeLwcBlockJson, type LwcJsStatementJson } from './statement';
import { makeLwcTypeJson, type LwcTypeJson } from './type';

// ---------------------------------------------------------------------------
// JSON の型
// ---------------------------------------------------------------------------

/** 識別子 (recordId・undefined など。Apex は文字列だが、7 章の 3 で式の種類を kind で明示する) */
export type LwcJsIdentifierJson = JsonType<'jsIdentifier'> & { name: string };

/** #x in obj の #x */
export type LwcJsPrivateNameJson = JsonType<'jsPrivateName'> & { name: string };

export type LwcJsThisJson = JsonType<'jsThis'>;

export type LwcJsSuperJson = JsonType<'jsSuper'>;

export type LwcJsStringJson = JsonType<'jsString'> & { value: string };

export type LwcJsNumberJson = JsonType<'jsNumber'> & { value: number };

export type LwcJsBooleanJson = JsonType<'jsBoolean'> & { value: boolean };

export type LwcJsNullJson = JsonType<'jsNull'>;

export type LwcJsBigIntJson = JsonType<'jsBigInt'> & {
    /** 1n の 1 (number にすると桁が落ちるので文字列) */
    value: string;
};

export type LwcJsRegExpJson = JsonType<'jsRegExp'> & {
    pattern: string;
    /** フラグ (dgimsuvy の順) */
    flags: string;
};

/** テンプレートリテラル (`c-${name}`)。quasis は式の前後の文字列 (書いたまま。quasis の数は式の数 + 1) */
export type LwcJsTemplateJson = JsonType<'jsTemplate'> & {
    quasis: string[];
    expressions: LwcJsExpressionJson[];
};

/** タグ付きテンプレート (html`...`) */
export type LwcJsTaggedTemplateJson = JsonType<'jsTaggedTemplate'> & {
    tag: LwcJsExpressionJson;
    quasi: LwcJsTemplateJson;
    typeArguments?: LwcTypeJson[];
};

/** 関数の呼び出し・new の引数 (...args を含む) */
export type LwcJsArgumentJson = LwcJsExpressionJson | LwcJsSpreadJson;

/**
 * メンバーの参照・メソッドの呼び出し (Apex の memberAccess に当たる。境界ノード)。
 * a.b / a?.b / a[i] / a?.[i] は type: 'object'、a.b(...) / a?.b(...) / a.b?.(...) は type: 'method'
 */
export type LwcJsMemberAccessJson = JsonType<'jsMemberAccess'> & {
    type: 'object' | 'method';
    /** super.x の super は jsSuper */
    object: LwcJsExpressionJson;
    /** '?.' はオプショナルチェーン (a?.b・a?.[i]・a?.b()) */
    operator: '.' | '?.';
    /** メンバーの名前 (#x は '#x')。計算されたメンバー (a[i]) は持たず computed を持つ */
    member?: string;
    /** 計算されたメンバー (this[NavigationMixin.Navigate] の NavigationMixin.Navigate) */
    computed?: LwcJsExpressionJson;
    /** type: 'method' の引数 (Apex の memberArg) */
    memberArg?: LwcJsArgumentJson[];
    /** a.b?.() (呼び出しのオプショナルチェーン) */
    optionalCall?: boolean;
    /** a.b<T>() の型引数 */
    typeArguments?: LwcTypeJson[];
};

/** メンバーの参照でない式の呼び出し (f(x)・super(x)・(a || b)(x)。境界ノード) */
export type LwcJsCallJson = JsonType<'jsCall'> & {
    /** super(...) の super は jsSuper */
    callee: LwcJsExpressionJson;
    arg: LwcJsArgumentJson[];
    /** f?.() */
    optionalCall?: boolean;
    typeArguments?: LwcTypeJson[];
};

/** 動的 import (import('c/x')・import('c/x', options)) */
export type LwcJsImportCallJson = JsonType<'jsImportCall'> & {
    source: LwcJsExpressionJson;
    options?: LwcJsExpressionJson;
    /** import.source(...) / import.defer(...) */
    phase?: string;
};

export type LwcJsNewJson = JsonType<'jsNew'> & {
    callee: LwcJsExpressionJson;
    arg: LwcJsArgumentJson[];
    typeArguments?: LwcTypeJson[];
};

/** ...x (引数・配列の要素・オブジェクトのプロパティ) */
export type LwcJsSpreadJson = JsonType<'jsSpread'> & { argument: LwcJsExpressionJson };

/** オブジェクトのプロパティ・分割代入のプロパティの名前 (計算されたキーは computed) */
type LwcJsPropertyKeyJson = { key?: string; computed?: LwcJsExpressionJson };

/** オブジェクトの key: value ({ recordId } の省略形は shorthand: true) */
export type LwcJsPropertyJson = JsonType<'jsProperty'> &
    LwcJsPropertyKeyJson & {
        value: LwcJsExpressionJson;
        shorthand: boolean;
    };

/** オブジェクトのメソッド ({ run() {} }・{ get x() {} }) */
export type LwcJsObjectMethodJson = JsonType<'jsObjectMethod'> &
    LwcJsPropertyKeyJson & {
        methodKind: 'method' | 'get' | 'set';
        async: boolean;
        generator: boolean;
        param: LwcParameterJson[];
        returnType?: LwcTypeJson;
        /** 本体の文 */
        block: LwcJsStatementJson[];
    };

export type LwcJsObjectJson = JsonType<'jsObject'> & {
    properties: (LwcJsPropertyJson | LwcJsObjectMethodJson | LwcJsSpreadJson)[];
};

export type LwcJsArrayJson = JsonType<'jsArray'> & {
    /** null は穴 ([a, , b]) */
    elements: (LwcJsArgumentJson | null)[];
};

/** アロー関数・function 式。本体はブロック (block。文の並び) か式 (expression。アロー関数の x => x.id) */
export type LwcJsFunctionJson = JsonType<'jsFunction'> & {
    arrow: boolean;
    async: boolean;
    generator: boolean;
    /** function name() {} の name */
    name?: string;
    param: LwcParameterJson[];
    returnType?: LwcTypeJson;
    block?: LwcJsStatementJson[];
    expression?: LwcJsExpressionJson;
};

/** クラス式。メンバーはコンポーネントと同じ形 (段階 5) */
export type LwcJsClassJson = JsonType<'jsClass'> & {
    name?: string;
    superClass?: LwcJsExpressionJson;
    /** TS の implements */
    implement?: LwcTypeJson[];
    /** メンバー (ソースの順) */
    block: LwcMemberJson[];
};

export type LwcJsAwaitJson = JsonType<'jsAwait'> & { argument: LwcJsExpressionJson };

export type LwcJsYieldJson = JsonType<'jsYield'> & {
    /** yield* */
    delegate: boolean;
    argument?: LwcJsExpressionJson;
};

/** 単項の式 (!x・-x・typeof x・void x・delete x) と ++ / -- (Apex の UnaryJson と同じく operatorLocation を持つ) */
export type LwcJsUnaryJson = JsonType<'jsUnary'> & {
    operator: string;
    operatorLocation: 'front' | 'back';
    argument: LwcJsExpressionJson;
};

/** 二項の式 (a + b・a === b・a instanceof B・#x in obj) */
export type LwcJsBinaryJson = JsonType<'jsBinary'> & {
    left: LwcJsExpressionJson | LwcJsPrivateNameJson;
    operator: string;
    right: LwcJsExpressionJson;
};

/** 論理の式 (a && b・a || b・a ?? b) */
export type LwcJsLogicalJson = JsonType<'jsLogical'> & {
    left: LwcJsExpressionJson;
    operator: '&&' | '||' | '??';
    right: LwcJsExpressionJson;
};

/** 代入 (a = b・a += b・a ??= b・[a, b] = c) */
export type LwcJsAssignmentJson = JsonType<'jsAssignment'> & {
    left: LwcJsExpressionJson | LwcJsPatternJson;
    operator: string;
    right: LwcJsExpressionJson;
};

/** a ? b : c (Apex の TernaryJson と同じ名前) */
export type LwcJsConditionalJson = JsonType<'jsConditional'> & {
    condition: LwcJsExpressionJson;
    trueValue: LwcJsExpressionJson;
    falseValue: LwcJsExpressionJson;
};

/** a, b */
export type LwcJsSequenceJson = JsonType<'jsSequence'> & { expressions: LwcJsExpressionJson[] };

/** (x) (Apex の SubJson に当たる) */
export type LwcJsParenthesizedJson = JsonType<'jsParenthesized'> & {
    expression: LwcJsExpressionJson;
};

/** x as T / x satisfies T / <T>x / Flow の (x: T) */
export type LwcJsTypeCastJson = JsonType<'jsTypeCast'> & {
    expression: LwcJsExpressionJson;
    operator: 'as' | 'satisfies' | '<>' | ':';
    convertType: LwcTypeJson;
};

/** x! */
export type LwcJsNonNullJson = JsonType<'jsNonNull'> & { expression: LwcJsExpressionJson };

/** f<T> (呼び出さない型引数つきの式) */
export type LwcJsInstantiationJson = JsonType<'jsInstantiation'> & {
    expression: LwcJsExpressionJson;
    typeArguments: LwcTypeJson[];
};

/** new.target / import.meta */
export type LwcJsMetaPropertyJson = JsonType<'jsMetaProperty'> & {
    meta: 'new.target' | 'import.meta';
};

/** 今の構文解析のプラグインでは作られない式 (JSX・提案段階の構文)。種類 (IR の kind) だけを持つ */
export type LwcJsUnsupportedJson = JsonType<'jsUnsupported'> & { nodeType: string };

/** 分割代入のプロパティ ({ a: b = 1 } の a: b = 1) */
export type LwcJsPatternPropertyJson = JsonType<'jsPatternProperty'> &
    LwcJsPropertyKeyJson & {
        value: LwcJsPatternJson;
        shorthand: boolean;
    };

/** { a, b: c, ...rest } (代入の左辺) */
export type LwcJsObjectPatternJson = JsonType<'jsObjectPattern'> & {
    properties: LwcJsPatternPropertyJson[];
    rest?: LwcJsRestJson;
};

/** [a, , b, ...rest] (代入の左辺。null は穴) */
export type LwcJsArrayPatternJson = JsonType<'jsArrayPattern'> & {
    elements: (LwcJsPatternJson | null)[];
};

/** 既定値つきの分割代入 (a = 1) */
export type LwcJsAssignmentPatternJson = JsonType<'jsAssignmentPattern'> & {
    left: LwcJsPatternJson;
    right: LwcJsExpressionJson;
};

/** ...rest */
export type LwcJsRestJson = JsonType<'jsRest'> & { argument: LwcJsPatternJson };

/** void (捨てる束縛) */
export type LwcJsVoidPatternJson = JsonType<'jsVoidPattern'>;

/** 代入の左辺・分割代入の中身 (識別子・メンバーの参照は式のまま) */
export type LwcJsPatternJson =
    | LwcJsObjectPatternJson
    | LwcJsArrayPatternJson
    | LwcJsAssignmentPatternJson
    | LwcJsRestJson
    | LwcJsVoidPatternJson
    | LwcJsExpressionJson;

export type LwcJsExpressionJson =
    | LwcJsIdentifierJson
    | LwcJsThisJson
    | LwcJsSuperJson
    | LwcJsStringJson
    | LwcJsNumberJson
    | LwcJsBooleanJson
    | LwcJsNullJson
    | LwcJsBigIntJson
    | LwcJsRegExpJson
    | LwcJsTemplateJson
    | LwcJsTaggedTemplateJson
    | LwcJsMemberAccessJson
    | LwcJsCallJson
    | LwcJsImportCallJson
    | LwcJsNewJson
    | LwcJsObjectJson
    | LwcJsArrayJson
    | LwcJsFunctionJson
    | LwcJsClassJson
    | LwcJsAwaitJson
    | LwcJsYieldJson
    | LwcJsUnaryJson
    | LwcJsBinaryJson
    | LwcJsLogicalJson
    | LwcJsAssignmentJson
    | LwcJsConditionalJson
    | LwcJsSequenceJson
    | LwcJsParenthesizedJson
    | LwcJsTypeCastJson
    | LwcJsNonNullJson
    | LwcJsInstantiationJson
    | LwcJsMetaPropertyJson
    | LwcJsUnsupportedJson;

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

type ExpressionContext = { tables: LwcImportTables; context: LwcJsonContext };

/** 型引数 (TS の <T>・Flow の <T>) */
const typeArgumentsOf = (
    node: LwcNode | null | undefined,
    { context }: ExpressionContext,
): { typeArguments?: LwcTypeJson[] } => {
    if (!node) return {};
    const { params } = node.getFields() as { params?: LwcNode[] };
    return params && params.length > 0
        ? { typeArguments: params.map((param) => makeLwcTypeJson(param, context)) }
        : {};
};

/** 関数の本体のブロック (メソッドと同じく文の並び) */
const makeBlockJson = (
    block: ir.BlockStatementTypeClass,
    { tables, context }: ExpressionContext,
): LwcJsStatementJson[] => makeLwcBlockJson(block, tables, context);

/** オブジェクトのプロパティ・分割代入のプロパティの名前 */
const makePropertyKeyJson = (
    fields: { key: LwcNode; computed: boolean },
    scope: ExpressionContext,
): LwcJsPropertyKeyJson => {
    if (fields.computed) return { computed: makeExpression(fields.key, scope) };
    const key = fields.key;
    switch (key.kind) {
        case 'numericLiteral':
            return { key: String((key as ir.NumericLiteralTypeClass).getFields().value) };
        case 'bigIntLiteral':
            return { key: String((key as ir.BigIntLiteralTypeClass).getFields().value) };
        default:
            // identifier・stringLiteral・privateName
            return { key: nameOf(key, scope.context) };
    }
};

const makeArguments = (args: LwcNode[], scope: ExpressionContext): LwcJsArgumentJson[] =>
    args.map((arg) => makeArgument(arg, scope));

const makeArgument = (node: LwcNode, scope: ExpressionContext): LwcJsArgumentJson =>
    node.kind === 'spreadElement'
        ? makeJsonType<'jsSpread', LwcJsSpreadJson>('jsSpread', scope.context.keysOf(node), {
              argument: makeExpression(
                  (node as ir.SpreadElementTypeClass).getFields().argument,
                  scope,
              ),
          })
        : makeExpression(node, scope);

const makeParams = (params: LwcNode[], { tables, context }: ExpressionContext) =>
    (params as LwcParameterNode[]).map((param) => makeLwcParameterJson(param, tables, context));

/** メンバーの参照 (memberExpression・optionalMemberExpression) の中身 */
const memberPartsOf = (node: LwcNode) => {
    const fields = node.getFields() as unknown as {
        object: LwcNode;
        property: LwcNode;
        computed: boolean;
        optional?: boolean;
    };
    return fields;
};

const makeMemberParts = (
    node: LwcNode,
    scope: ExpressionContext,
): Pick<LwcJsMemberAccessJson, 'object' | 'operator' | 'member' | 'computed'> => {
    const { object, property, computed, optional } = memberPartsOf(node);
    return {
        object: makeExpression(object, scope),
        operator: optional === true ? '?.' : '.',
        ...(computed
            ? { computed: makeExpression(property, scope) }
            : { member: nameOf(property, scope.context) }),
    };
};

/** 呼び出し (callExpression・optionalCallExpression)。callee がメンバーの参照なら jsMemberAccess (type: 'method') */
const makeCall = (
    node:
        ir.CallExpressionTypeClass | standardizedVisitor.OptionalCallExpressionTypeClass | LwcNode,
    scope: ExpressionContext,
): LwcJsExpressionJson => {
    const { context } = scope;
    const fields = node.getFields() as unknown as {
        kind?: 'super' | 'import' | 'normal';
        callee: LwcNode;
        arguments: LwcNode[];
        optional?: boolean;
        typeArguments: LwcNode | null;
    };
    if (fields.kind === 'import') {
        // 旧い形の import(source, options)
        const [source, options] = fields.arguments;
        return makeJsonType<'jsImportCall', LwcJsImportCallJson>(
            'jsImportCall',
            context.keysOf(node),
            {
                source: makeExpression(source!, scope),
                ...(options ? { options: makeExpression(options, scope) } : {}),
            },
        );
    }
    const optionalCall = fields.optional === true ? { optionalCall: true } : {};
    const typeArguments = typeArgumentsOf(fields.typeArguments, scope);
    const { callee } = fields;
    if (callee.kind === 'memberExpression' || callee.kind === 'optionalMemberExpression') {
        return makeJsonType<'jsMemberAccess', LwcJsMemberAccessJson>(
            'jsMemberAccess',
            context.keysOf(node),
            {
                type: 'method',
                ...makeMemberParts(callee, scope),
                memberArg: makeArguments(fields.arguments, scope),
                ...optionalCall,
                ...typeArguments,
            },
        );
    }
    return makeJsonType<'jsCall', LwcJsCallJson>('jsCall', context.keysOf(node), {
        callee: makeExpression(callee, scope),
        arg: makeArguments(fields.arguments, scope),
        ...optionalCall,
        ...typeArguments,
    });
};

/** テンプレートリテラル */
const makeTemplate = (
    node: ir.TemplateLiteralTypeClass,
    scope: ExpressionContext,
): LwcJsTemplateJson => {
    const { head, spans } = node.getFields();
    return makeJsonType<'jsTemplate', LwcJsTemplateJson>('jsTemplate', scope.context.keysOf(node), {
        quasis: [head, ...spans.map((span) => span.tail)].map(
            (element) => element.getFields().value.raw,
        ),
        expressions: spans.map((span) => makeExpression(span.expression, scope)),
    });
};

/** 関数 (アロー関数・function 式) */
const makeFunction = (
    node: ir.ArrowFunctionExpressionTypeClass | ir.FunctionExpressionTypeClass,
    scope: ExpressionContext,
): LwcJsFunctionJson => {
    const { context } = scope;
    const keys = context.keysOf(node);
    const common = (fields: { params: LwcNode[]; async: boolean; returnType: LwcNode | null }) => ({
        param: makeParams(fields.params, scope),
        ...(fields.returnType ? { returnType: makeLwcTypeJson(fields.returnType, context) } : {}),
    });
    if (node.kind === 'arrowFunctionExpression') {
        const fields = node.getFields();
        return makeJsonType<'jsFunction', LwcJsFunctionJson>('jsFunction', keys, {
            arrow: true,
            async: fields.async === true,
            generator: false,
            ...common(fields),
            ...(fields.body.kind === 'block'
                ? { block: makeBlockJson(fields.body.block, scope) }
                : { expression: makeExpression(fields.body.expression, scope) }),
        });
    }
    const fields = node.getFields();
    return makeJsonType<'jsFunction', LwcJsFunctionJson>('jsFunction', keys, {
        arrow: false,
        async: fields.async === true,
        generator: fields.generator === true,
        ...(fields.id ? { name: fields.id.getFields().name } : {}),
        ...common(fields),
        block: makeBlockJson(fields.body, scope),
    });
};

/** オブジェクトの式 */
const makeObject = (
    node: ir.ObjectExpressionTypeClass,
    scope: ExpressionContext,
): LwcJsObjectJson => {
    const { context } = scope;
    return makeJsonType<'jsObject', LwcJsObjectJson>('jsObject', context.keysOf(node), {
        properties: node.getFields().properties.map((property) => {
            switch (property.kind) {
                case 'spreadElement':
                    return makeArgument(property, scope) as LwcJsSpreadJson;
                case 'objectMethod': {
                    const fields = property.getFields();
                    return makeJsonType<'jsObjectMethod', LwcJsObjectMethodJson>(
                        'jsObjectMethod',
                        context.keysOf(property),
                        {
                            ...makePropertyKeyJson(fields, scope),
                            methodKind: fields.kind,
                            async: fields.kind === 'method' && fields.async === true,
                            generator: fields.kind === 'method' && fields.generator === true,
                            param: makeParams(fields.params as LwcNode[], scope),
                            ...(fields.kind !== 'set' && fields.returnType
                                ? { returnType: makeLwcTypeJson(fields.returnType, context) }
                                : {}),
                            block: makeBlockJson(fields.body, scope),
                        },
                    );
                }
                default: {
                    const fields = property.getFields();
                    return makeJsonType<'jsProperty', LwcJsPropertyJson>(
                        'jsProperty',
                        context.keysOf(property),
                        {
                            ...makePropertyKeyJson(fields, scope),
                            value: makeExpression(fields.value, scope),
                            shorthand: fields.shorthand,
                        },
                    );
                }
            }
        }),
    });
};

// ---------------------------------------------------------------------------
// 分割代入 (代入の左辺)
// ---------------------------------------------------------------------------

const makePattern = (node: LwcNode, scope: ExpressionContext): LwcJsPatternJson => {
    const { context } = scope;
    const keys = () => context.keysOf(node);
    switch (node.kind) {
        case 'objectPattern': {
            const { properties, rest } = (node as ir.ObjectPatternTypeClass).getFields();
            return makeJsonType<'jsObjectPattern', LwcJsObjectPatternJson>(
                'jsObjectPattern',
                keys(),
                {
                    properties: properties.map((property) => {
                        const fields = property.getFields();
                        return makeJsonType<'jsPatternProperty', LwcJsPatternPropertyJson>(
                            'jsPatternProperty',
                            context.keysOf(property),
                            {
                                ...makePropertyKeyJson(fields, scope),
                                value: makePattern(fields.value, scope),
                                shorthand: fields.shorthand,
                            },
                        );
                    }),
                    ...(rest ? { rest: makePattern(rest, scope) as LwcJsRestJson } : {}),
                },
            );
        }
        case 'arrayPattern':
            return makeJsonType<'jsArrayPattern', LwcJsArrayPatternJson>('jsArrayPattern', keys(), {
                elements: (node as ir.ArrayPatternTypeClass)
                    .getFields()
                    .elements.map((element) =>
                        element ? makePattern(element as LwcNode, scope) : null,
                    ),
            });
        case 'assignmentPattern': {
            const { left, right } = (node as ir.AssignmentPatternTypeClass).getFields();
            return makeJsonType<'jsAssignmentPattern', LwcJsAssignmentPatternJson>(
                'jsAssignmentPattern',
                keys(),
                { left: makePattern(left, scope), right: makeExpression(right, scope) },
            );
        }
        case 'restElement':
            return makeJsonType<'jsRest', LwcJsRestJson>('jsRest', keys(), {
                argument: makePattern(
                    (node as ir.RestElementTypeClass).getFields().argument,
                    scope,
                ),
            });
        case 'voidPattern':
            return makeJsonType<'jsVoidPattern', LwcJsVoidPatternJson>('jsVoidPattern', keys());
        default:
            return makeExpression(node, scope);
    }
};

// ---------------------------------------------------------------------------
// 式
// ---------------------------------------------------------------------------

const UPDATE_OPERATORS = new Set(['++', '--']);

const makeExpression = (node: LwcNode, scope: ExpressionContext): LwcJsExpressionJson => {
    const { context } = scope;
    const keys = () => context.keysOf(node);
    const fields = node.getFields() as Record<string, unknown>;
    const child = (name: string) => makeExpression(fields[name] as LwcNode, scope);
    switch (node.kind) {
        case 'identifier':
            return makeJsonType<'jsIdentifier', LwcJsIdentifierJson>('jsIdentifier', keys(), {
                name: fields.name as string,
            });
        case 'thisExpression':
            return makeJsonType<'jsThis', LwcJsThisJson>('jsThis', keys());
        case 'super':
            // super は式の位置には書けないが、callee・メンバーの参照の object として来る
            return makeJsonType<'jsSuper', LwcJsSuperJson>('jsSuper', keys());
        case 'stringLiteral':
            return makeJsonType<'jsString', LwcJsStringJson>('jsString', keys(), {
                value: fields.value as string,
            });
        case 'numericLiteral':
            return makeJsonType<'jsNumber', LwcJsNumberJson>('jsNumber', keys(), {
                value: fields.value as number,
            });
        case 'booleanLiteral':
            return makeJsonType<'jsBoolean', LwcJsBooleanJson>('jsBoolean', keys(), {
                value: fields.value as boolean,
            });
        case 'nullLiteral':
            return makeJsonType<'jsNull', LwcJsNullJson>('jsNull', keys());
        case 'bigIntLiteral':
            return makeJsonType<'jsBigInt', LwcJsBigIntJson>('jsBigInt', keys(), {
                value: String(fields.value),
            });
        case 'regExpLiteral':
            return makeJsonType<'jsRegExp', LwcJsRegExpJson>('jsRegExp', keys(), {
                pattern: fields.pattern as string,
                flags: regExpFlagsOf(fields.flags as ir.RegExpFlags),
            });
        case 'templateLiteral':
            return makeTemplate(node as ir.TemplateLiteralTypeClass, scope);
        case 'taggedTemplateExpression': {
            const tagged = (node as ir.TaggedTemplateExpressionTypeClass).getFields();
            return makeJsonType<'jsTaggedTemplate', LwcJsTaggedTemplateJson>(
                'jsTaggedTemplate',
                keys(),
                {
                    tag: makeExpression(tagged.tag, scope),
                    quasi: makeTemplate(tagged.quasi, scope),
                    ...typeArgumentsOf(tagged.typeArguments, scope),
                },
            );
        }
        case 'memberExpression':
        case 'optionalMemberExpression':
            return makeJsonType<'jsMemberAccess', LwcJsMemberAccessJson>('jsMemberAccess', keys(), {
                type: 'object',
                ...makeMemberParts(node, scope),
            });
        case 'callExpression':
        case 'optionalCallExpression':
            return makeCall(node, scope);
        case 'importExpression': {
            const { phase, source, options } = (node as ir.ImportExpressionTypeClass).getFields();
            return makeJsonType<'jsImportCall', LwcJsImportCallJson>('jsImportCall', keys(), {
                source: makeExpression(source, scope),
                ...(options ? { options: makeExpression(options, scope) } : {}),
                ...(phase ? { phase } : {}),
            });
        }
        case 'newExpression': {
            const created = (node as ir.NewExpressionTypeClass).getFields();
            return makeJsonType<'jsNew', LwcJsNewJson>('jsNew', keys(), {
                callee: makeExpression(created.callee, scope),
                arg: makeArguments(created.arguments, scope),
                ...typeArgumentsOf(created.typeArguments, scope),
            });
        }
        case 'objectExpression':
            return makeObject(node as ir.ObjectExpressionTypeClass, scope);
        case 'arrayExpression':
            return makeJsonType<'jsArray', LwcJsArrayJson>('jsArray', keys(), {
                elements: (node as ir.ArrayExpressionTypeClass)
                    .getFields()
                    .elements.map((element) => (element ? makeArgument(element, scope) : null)),
            });
        case 'arrowFunctionExpression':
        case 'functionExpression':
            return makeFunction(
                node as ir.ArrowFunctionExpressionTypeClass | ir.FunctionExpressionTypeClass,
                scope,
            );
        case 'classExpression': {
            const classFields = (node as ir.ClassExpressionTypeClass).getFields();
            const { id, heritage } = classFields;
            const implement = (classFields.implements ?? []).map((i) =>
                makeLwcTypeJson(i, context),
            );
            return makeJsonType<'jsClass', LwcJsClassJson>('jsClass', keys(), {
                ...(id ? { name: id.getFields().name } : {}),
                ...(heritage?.superClass
                    ? { superClass: makeExpression(heritage.superClass, scope) }
                    : {}),
                ...(implement.length > 0 ? { implement } : {}),
                block: makeLwcClassMembersJson(
                    classFields.body.getFields().body,
                    scope.tables,
                    context,
                ),
            });
        }
        case 'awaitExpression':
            return makeJsonType<'jsAwait', LwcJsAwaitJson>('jsAwait', keys(), {
                argument: child('argument'),
            });
        case 'yieldExpression':
            return makeJsonType<'jsYield', LwcJsYieldJson>('jsYield', keys(), {
                delegate: fields.delegate === true,
                ...(fields.argument ? { argument: child('argument') } : {}),
            });
        case 'unaryExpression':
        case 'updateExpression': {
            const operator = fields.operator as string;
            const back = UPDATE_OPERATORS.has(operator) && fields.prefix === false;
            return makeJsonType<'jsUnary', LwcJsUnaryJson>('jsUnary', keys(), {
                operator,
                operatorLocation: back ? 'back' : 'front',
                argument: child('argument'),
            });
        }
        case 'binaryExpression': {
            const left = fields.left as LwcNode;
            return makeJsonType<'jsBinary', LwcJsBinaryJson>('jsBinary', keys(), {
                left:
                    left.kind === 'privateName'
                        ? makeJsonType<'jsPrivateName', LwcJsPrivateNameJson>(
                              'jsPrivateName',
                              context.keysOf(left),
                              { name: nameOf(left, context) },
                          )
                        : makeExpression(left, scope),
                operator: fields.operator as string,
                right: child('right'),
            });
        }
        case 'logicalExpression':
            return makeJsonType<'jsLogical', LwcJsLogicalJson>('jsLogical', keys(), {
                left: child('left'),
                operator: fields.operator as LwcJsLogicalJson['operator'],
                right: child('right'),
            });
        case 'assignmentExpression':
            return makeJsonType<'jsAssignment', LwcJsAssignmentJson>('jsAssignment', keys(), {
                left: makePattern(fields.left as LwcNode, scope),
                operator: fields.operator as string,
                right: child('right'),
            });
        case 'conditionalExpression':
            return makeJsonType<'jsConditional', LwcJsConditionalJson>('jsConditional', keys(), {
                condition: child('test'),
                trueValue: child('consequent'),
                falseValue: child('alternate'),
            });
        case 'sequenceExpression':
            return makeJsonType<'jsSequence', LwcJsSequenceJson>('jsSequence', keys(), {
                expressions: (fields.expressions as LwcNode[]).map((e) => makeExpression(e, scope)),
            });
        case 'parenthesizedExpression':
            return makeJsonType<'jsParenthesized', LwcJsParenthesizedJson>(
                'jsParenthesized',
                keys(),
                { expression: child('expression') },
            );
        case 'tSAsExpression':
        case 'tSSatisfiesExpression':
        case 'tSTypeAssertion':
        case 'typeCastExpression':
            return makeJsonType<'jsTypeCast', LwcJsTypeCastJson>('jsTypeCast', keys(), {
                expression: child('expression'),
                operator: CAST_OPERATORS[node.kind]!,
                convertType: makeLwcTypeJson(fields.typeAnnotation as LwcNode, context),
            });
        case 'tSNonNullExpression':
            return makeJsonType<'jsNonNull', LwcJsNonNullJson>('jsNonNull', keys(), {
                expression: child('expression'),
            });
        case 'tSInstantiationExpression':
            return makeJsonType<'jsInstantiation', LwcJsInstantiationJson>(
                'jsInstantiation',
                keys(),
                {
                    expression: child('expression'),
                    typeArguments:
                        typeArgumentsOf(fields.typeArguments as LwcNode | null, scope)
                            .typeArguments ?? [],
                },
            );
        case 'metaProperty':
            return makeJsonType<'jsMetaProperty', LwcJsMetaPropertyJson>('jsMetaProperty', keys(), {
                meta: fields.kind as LwcJsMetaPropertyJson['meta'],
            });
        default:
            // JSX・提案段階の構文 (bind / do / module 式・パイプラインの topic・部分適用の ?・V8 の %名前)
            return makeJsonType<'jsUnsupported', LwcJsUnsupportedJson>('jsUnsupported', keys(), {
                nodeType: node.kind,
            });
    }
};

/** 正規表現のフラグ (IR は真偽値の組) を、書く順の文字列 (dgimsuvy) にする */
const regExpFlagsOf = (flags: ir.RegExpFlags): string =>
    [
        flags.hasIndices ? 'd' : '',
        flags.global ? 'g' : '',
        flags.ignoreCase ? 'i' : '',
        flags.multiline ? 'm' : '',
        flags.dotAll ? 's' : '',
        flags.unicode === 'unicode' ? 'u' : flags.unicode === 'unicodeSets' ? 'v' : '',
        flags.sticky ? 'y' : '',
    ].join('');

const CAST_OPERATORS: Record<string, LwcJsTypeCastJson['operator']> = {
    tSAsExpression: 'as',
    tSSatisfiesExpression: 'satisfies',
    tSTypeAssertion: '<>',
    typeCastExpression: ':',
};

/** 式 → JSON (5.4)。引数・配列の要素の ...x は makeLwcArgumentJson */
export const makeLwcExpressionJson = (
    node: LwcNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcJsExpressionJson => makeExpression(node, { tables, context });

/** 代入の左辺・宣言の名前・分割代入 (識別子は jsIdentifier) → JSON */
export const makeLwcPatternJson = (
    node: LwcNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcJsPatternJson => makePattern(node, { tables, context });

/** 呼び出し・new の引数 (...x を含む) → JSON */
export const makeLwcArgumentJson = (
    node: LwcNode,
    tables: LwcImportTables,
    context: LwcJsonContext,
): LwcJsArgumentJson => makeArgument(node, { tables, context });
