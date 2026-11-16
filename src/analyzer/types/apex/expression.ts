import { JsonType } from '../commons';
import type {
    ArrayExpressionTypeClass,
    Arth1ExpressionTypeClass,
    Arth2ExpressionTypeClass,
    AssignExpressionTypeClass,
    BasedExpressionTypeClass,
    BitAndExpressionTypeClass,
    BitExpressionTypeClass,
    BitNotExpressionTypeClass,
    BitOrExpressionTypeClass,
    CastExpressionTypeClass,
    CmpExpressionTypeClass,
    CoalExpressionTypeClass,
    CondExpressionTypeClass,
    CreatedNameTypeClass,
    DotExpressionTypeClass,
    EqualityExpressionTypeClass,
    ExpressionListTypeClass,
    ExpressionTypeClass,
    InstanceOfExpressionTypeClass,
    LogAndExpressionTypeClass,
    LogOrExpressionTypeClass,
    MethodCallExpressionTypeClass,
    NegExpressionTypeClass,
    NewExpressionTypeClass,
    PostOpExpressionTypeClass,
    PreOpExpressionTypeClass,
    SubExpressionTypeClass,
    TypeRefTypeClass,
} from '../apex_IR';

import { makeNodeJson } from './commons/node';
import {
    type TypeContentJson,
    type TypeJson,
    makeTypeContentJsonOfNames,
    makeTypeJson,
} from './type';
import {
    type ClassLiteralJson,
    type IdentifierJson,
    type LiteralJson,
    type SuperJson,
    type ThisJson,
    type UnsupportedJson,
    makePrimaryJson,
} from './primary';
import type { SoqlJson } from './query/soql';
import type { SoslJson } from './query/sosl';

// Apex の式の JSON (docs/apex-json-review.md 2.2・6.1 の C。docs/json-redesign-plan.md の段階 A2)。
// - 式はすべて kind と sourceKeys を持つ (LWC の js* と同じ考え。名前は接頭辞なし。json-redesign-plan 6 章の 1)
// - ソースの文字列・定数 (引用符つきのリテラル、'()'、'{}'、'list || set'、回復のときの getText()) は持たない
// - 数のリテラルは精度のため文字列のまま (6 章の 3)

export type { ClassLiteralJson, IdentifierJson, LiteralJson, SuperJson, ThisJson, UnsupportedJson };

/** ラベルのない式 (ExpressionContext そのもの)。ANTLR の回復でしかできず、ふだんは作られない */
const makeUnsupportedExpressionJson = (target: ExpressionTypeClass): UnsupportedJson =>
    makeNodeJson<UnsupportedJson>('unsupported', target, { nodeType: 'expression' });

export const makeExpressionListJson = (target: ExpressionListTypeClass): BaseExpressionJson[] =>
    target.getFields().value.map((v) => makeExpressionJsonConvert(v));

/** a.b / a.b(...) / a?.b */
export type DotMethodCallJson = JsonType<'memberAccess'> & {
    type: 'object' | 'method';
    object: BaseExpressionJson;
    operator: '.' | '?.';
    member: string;
    memberArg?: BaseExpressionJson[];
};

const makeDotMethodCallJson = (target: DotExpressionTypeClass): DotMethodCallJson => {
    const { left, operator, right } = target.getFields();
    const object = makeExpressionJsonConvert(left);

    // right はフィールド名 (anyId) かメソッド呼び出し (dotMethodCall)
    switch (right.kind) {
        case 'anyId':
            return makeNodeJson<DotMethodCallJson>('memberAccess', target, {
                type: 'object',
                object: object,
                operator: operator,
                member: right.getFields().value,
            });
        case 'dotMethodCall': {
            const { value, param } = right.getFields();
            return makeNodeJson<DotMethodCallJson>('memberAccess', target, {
                type: 'method',
                object: object,
                operator: operator,
                member: value.getFields().value,
                ...(param ? { memberArg: makeExpressionListJson(param) } : {}),
            });
        }
    }
};

/** 名前の呼び出し f(...)、this(...) / super(...) (コンストラクターの呼び出し) */
export type CallJson = JsonType<'call'> & {
    callee: IdentifierJson | ThisJson | SuperJson;
    arg: BaseExpressionJson[];
};

const makeCallJson = (target: MethodCallExpressionTypeClass): CallJson => {
    const call = target.getFields().value;
    const fields = call.getFields();
    const callee: CallJson['callee'] =
        fields.kind === 'method'
            ? makeNodeJson<IdentifierJson>('identifier', fields.value, {
                  name: fields.value.getFields().value,
              })
            : makeNodeJson<ThisJson | SuperJson>(fields.kind, call);
    return makeNodeJson<CallJson>('call', target, {
        callee,
        arg: fields.param ? makeExpressionListJson(fields.param) : [],
    });
};

/**
 * new。作る型は型の JSON (newType)。初期化は種類ごと:
 * - new X(...) は arg、new List<X>{ ... } / new X[]{ ... } は elements、new Map<K, V>{ k => v } は entries、
 *   new X[n] は size。new X[] (初期化なし) はどれも持たない。{} (空) は elements か entries の空の配列
 */
export type NewJson = JsonType<'new'> & {
    newType: TypeJson;
    arg?: BaseExpressionJson[];
    elements?: BaseExpressionJson[];
    entries?: NewEntryJson[];
    size?: BaseExpressionJson;
};

/** new Map の初期化の 1 組 (kind を持たない入れ物) */
export type NewEntryJson = { key: BaseExpressionJson; value: BaseExpressionJson };

/** new の型の名前 (List<Account> / Outer.Inner / X[]) */
const makeNewTypeJson = (target: CreatedNameTypeClass, array: boolean): TypeJson => {
    const pairs = target.getFields().value;
    const names = pairs.map((pair) => pair.getFields().left.getFields().value);
    // 型引数は最後の名前のものだけを見る
    const generic: readonly TypeRefTypeClass[] | null =
        pairs.at(-1)?.getFields().right?.getFields().value ?? null;
    const content: TypeContentJson = makeTypeContentJsonOfNames(names, generic);
    return makeNodeJson<TypeJson>(
        'type',
        target,
        array ? { type: 'array', elementType: content, dimension: 1 } : content,
    );
};

const makeNewJson = (target: NewExpressionTypeClass): NewJson => {
    const creator = target.getFields().value.getFields();
    const rest = creator.content;
    const newType = makeNewTypeJson(creator.value, rest.kind === 'arrayCreatorRest');
    const isMap = newType.type === 'map';
    switch (rest.kind) {
        case 'arrayCreatorRest': {
            const array = rest.getFields();
            if (array.kind === 'sized') {
                return makeNodeJson<NewJson>('new', target, {
                    newType,
                    size: makeExpressionJsonConvert(array.size),
                });
            }
            return makeNodeJson<NewJson>('new', target, {
                newType,
                ...(array.initializer
                    ? {
                          elements: array.initializer
                              .getFields()
                              .element.map((v) => makeExpressionJsonConvert(v)),
                      }
                    : {}),
            });
        }
        case 'classCreatorRest': {
            const elements = rest.getFields().value.getFields().elements;
            return makeNodeJson<NewJson>('new', target, {
                newType,
                arg: elements ? makeExpressionListJson(elements) : [],
            });
        }
        case 'mapCreatorRest':
            return makeNodeJson<NewJson>('new', target, {
                newType,
                entries: rest.getFields().value.map((v) => {
                    const { left, right } = v.getFields();
                    return {
                        key: makeExpressionJsonConvert(left),
                        value: makeExpressionJsonConvert(right),
                    };
                }),
            });
        case 'noRest':
            return makeNodeJson<NewJson>(
                'new',
                target,
                isMap ? { newType, entries: [] } : { newType, elements: [] },
            );
        case 'setCreatorRest':
            return makeNodeJson<NewJson>('new', target, {
                newType,
                elements: rest.getFields().value.map((v) => makeExpressionJsonConvert(v)),
            });
    }
};

/** (Type) expression */
export type CastJson = JsonType<'cast'> & {
    expression: BaseExpressionJson;
    convertType: TypeJson;
};

const makeCastJson = (target: CastExpressionTypeClass): CastJson => {
    const { value, valueType } = target.getFields();
    return makeNodeJson<CastJson>('cast', target, {
        expression: makeExpressionJsonConvert(value),
        convertType: makeTypeJson(valueType),
    });
};

/** ( expression ) */
export type ParenthesizedJson = JsonType<'parenthesized'> & {
    expression: BaseExpressionJson;
};

const makeParenthesizedJson = (target: SubExpressionTypeClass): ParenthesizedJson =>
    makeNodeJson<ParenthesizedJson>('parenthesized', target, {
        expression: makeExpressionJsonConvert(target.getFields().value),
    });

/** object[index] */
export type IndexJson = JsonType<'index'> & {
    object: BaseExpressionJson;
    index: BaseExpressionJson;
};

const makeIndexJson = (target: ArrayExpressionTypeClass): IndexJson => {
    const { value, index } = target.getFields();
    return makeNodeJson<IndexJson>('index', target, {
        object: makeExpressionJsonConvert(value),
        index: makeExpressionJsonConvert(index),
    });
};

/** 論理の演算子 (&& / || / ??) */
export type LogicalOperator = '&&' | '||' | '??';

/** 代入の演算子 */
export type AssignmentOperator =
    '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';

/** 二項の演算子 (論理・代入を除く) */
export type BinaryOperator =
    | '*'
    | '/'
    | '+'
    | '-'
    | '&'
    | '^'
    | '|'
    | '<<'
    | '>>'
    | '>>>'
    | '<'
    | '>'
    | '<='
    | '>='
    | '==='
    | '!=='
    | '=='
    | '!='
    | '<>';

export type BinaryJson = JsonType<'binary'> & {
    left: BaseExpressionJson;
    operator: BinaryOperator;
    right: BaseExpressionJson;
};

export type LogicalJson = JsonType<'logical'> & {
    left: BaseExpressionJson;
    operator: LogicalOperator;
    right: BaseExpressionJson;
};

export type AssignmentJson = JsonType<'assignment'> & {
    left: BaseExpressionJson;
    operator: AssignmentOperator;
    right: BaseExpressionJson;
};

// bitNotExpression は名前と違い XOR (`^`) の二項の式
type FormulaExpressionTypeClass =
    | Arth1ExpressionTypeClass
    | Arth2ExpressionTypeClass
    | AssignExpressionTypeClass
    | BitAndExpressionTypeClass
    | BitExpressionTypeClass
    | BitNotExpressionTypeClass
    | BitOrExpressionTypeClass
    | CmpExpressionTypeClass
    | CoalExpressionTypeClass
    | EqualityExpressionTypeClass
    | LogAndExpressionTypeClass
    | LogOrExpressionTypeClass;

const LOGICAL_OPERATORS = new Set<string>(['&&', '||', '??']);

const makeOperatorJson = (
    target: FormulaExpressionTypeClass,
): BinaryJson | LogicalJson | AssignmentJson => {
    const { left, operator, right } = target.getFields();
    const properties = {
        left: makeExpressionJsonConvert(left),
        right: makeExpressionJsonConvert(right),
    };
    // 比べる演算子の空白 (> > など) は parser の字句のままなので、空白を除いて持つ
    const op = String(operator).replace(/\s+/g, '');
    if (target.kind === 'assignExpression') {
        return makeNodeJson<AssignmentJson>('assignment', target, {
            ...properties,
            operator: op as AssignmentOperator,
        });
    }
    if (LOGICAL_OPERATORS.has(op)) {
        return makeNodeJson<LogicalJson>('logical', target, {
            ...properties,
            operator: op as LogicalOperator,
        });
    }
    return makeNodeJson<BinaryJson>('binary', target, {
        ...properties,
        operator: op as BinaryOperator,
    });
};

/** expression instanceof Type */
export type InstanceofJson = JsonType<'instanceof'> & {
    expression: BaseExpressionJson;
    checkType: TypeJson;
};

const makeInstanceofJson = (target: InstanceOfExpressionTypeClass): InstanceofJson => {
    const { left, right } = target.getFields();
    return makeNodeJson<InstanceofJson>('instanceof', target, {
        expression: makeExpressionJsonConvert(left),
        checkType: makeTypeJson(right),
    });
};

/** 単項の式 (!x / -x / ++x / x++ など) */
export type UnaryJson = JsonType<'unary'> & {
    operator: '~' | '!' | '++' | '--' | '+' | '-';
    operatorLocation: 'front' | 'back';
    argument: BaseExpressionJson;
};

type UnaryExpressionTypeClass =
    PreOpExpressionTypeClass | PostOpExpressionTypeClass | NegExpressionTypeClass;

const makeUnaryJson = (target: UnaryExpressionTypeClass): UnaryJson => {
    const { value, operator } = target.getFields();
    return makeNodeJson<UnaryJson>('unary', target, {
        operator: operator,
        operatorLocation: target.kind === 'postOpExpression' ? 'back' : 'front',
        argument: makeExpressionJsonConvert(value),
    });
};

/** condition ? trueValue : falseValue */
export type ConditionalJson = JsonType<'conditional'> & {
    condition: BaseExpressionJson;
    trueValue: BaseExpressionJson;
    falseValue: BaseExpressionJson;
};

const makeConditionalJson = (target: CondExpressionTypeClass): ConditionalJson => {
    const { condition, trueValue, falseValue } = target.getFields();
    return makeNodeJson<ConditionalJson>('conditional', target, {
        condition: makeExpressionJsonConvert(condition),
        trueValue: makeExpressionJsonConvert(trueValue),
        falseValue: makeExpressionJsonConvert(falseValue),
    });
};

/** 式 (どれも kind と sourceKeys を持つ) */
export type BaseExpressionJson =
    | IdentifierJson
    | ThisJson
    | SuperJson
    | LiteralJson
    | ClassLiteralJson
    | UnsupportedJson
    | SoqlJson
    | SoslJson
    | DotMethodCallJson
    | CallJson
    | NewJson
    | CastJson
    | ParenthesizedJson
    | IndexJson
    | BinaryJson
    | LogicalJson
    | AssignmentJson
    | InstanceofJson
    | UnaryJson
    | ConditionalJson;

/** 式の kind */
export type ExpressionKind = BaseExpressionJson['kind'];

/** 式の kind の一覧 (文の kind と分ける。docs/apex-json-review.md 2.5) */
export const EXPRESSION_KINDS: ReadonlySet<string> = new Set<ExpressionKind>([
    'identifier',
    'this',
    'super',
    'string',
    'integer',
    'long',
    'decimal',
    'boolean',
    'null',
    'classLiteral',
    'unsupported',
    'soql',
    'sosl',
    'memberAccess',
    'call',
    'new',
    'cast',
    'parenthesized',
    'index',
    'binary',
    'logical',
    'assignment',
    'instanceof',
    'unary',
    'conditional',
]);

/** 値が式の JSON か */
export const isExpressionJson = (value: unknown): value is BaseExpressionJson =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    EXPRESSION_KINDS.has(String((value as { kind?: unknown }).kind));

export const makeExpressionJsonConvert = (target: BasedExpressionTypeClass): BaseExpressionJson => {
    switch (target.kind) {
        case 'expression':
            return makeUnsupportedExpressionJson(target);
        case 'primaryExpression':
            return makePrimaryJson(target.getFields().value);
        case 'dotExpression':
            return makeDotMethodCallJson(target);
        case 'methodCallExpression':
            return makeCallJson(target);
        case 'newExpression':
            return makeNewJson(target);
        case 'castExpression':
            return makeCastJson(target);
        case 'subExpression':
            return makeParenthesizedJson(target);
        case 'arrayExpression':
            return makeIndexJson(target);
        case 'instanceOfExpression':
            return makeInstanceofJson(target);
        case 'condExpression':
            return makeConditionalJson(target);
        case 'preOpExpression':
        case 'postOpExpression':
        case 'negExpression':
            return makeUnaryJson(target);
        case 'arth1Expression':
        case 'arth2Expression':
        case 'assignExpression':
        case 'bitAndExpression':
        case 'bitExpression':
        case 'bitNotExpression':
        case 'bitOrExpression':
        case 'cmpExpression':
        case 'coalExpression':
        case 'equalityExpression':
        case 'logAndExpression':
        case 'logOrExpression':
            return makeOperatorJson(target);
    }
};
