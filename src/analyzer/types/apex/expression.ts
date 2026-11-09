import { ErrorJson, JsonType, ConvertKeys } from '../commons';
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
    CreatorRestTypeClass,
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
} from '../apex_IR_v2';

import { keysOf, makeNodeJson } from './commons/node';
import { makeTypeJson, TypeJson } from './type';
import { PrimaryJson, makePrimaryJson } from './primary';

/**
 * ラベルのない式 (ExpressionContext そのもの)。ANTLR の回復でしかできず、ふだんは作られない。
 * v1 と同じく、テキストをそのまま返す
 */
const makeExpressionJson = (target: ExpressionTypeClass): string => {
    return target.getFields().value;
};

const makeExpressionListJson = (target: ExpressionListTypeClass): BaseExpressionJson[] => {
    return target.getFields().value.map((v) => makeExpressionJsonConvert(v));
};

export type DotMethodCallJson = JsonType<'memberAccess'> & {
    type: 'object' | 'method';
    object: BaseExpressionJson | ErrorJson;
    operator: '.' | '?.';
    member: string;
    memberArg?: (BaseExpressionJson | ErrorJson)[] | ErrorJson;
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

export type MethodCallJson = JsonType<'memberAccess'> & {
    type: 'method';
    member: 'this' | 'super' | string;
    memberArg?: (BaseExpressionJson | ErrorJson)[] | ErrorJson;
    ref?: 'this' | 'super';
};

const makeMethodCallJson = (target: MethodCallExpressionTypeClass): MethodCallJson => {
    const methodCall = target.getFields().value.getFields();
    const memberArg = methodCall.param ? makeExpressionListJson(methodCall.param) : null;

    // this(...) / super(...) は member に 'this' / 'super' を入れる (v1 と同じく ref は持たない。
    // v1 でも、メソッド名がある呼び出しの ref はいつも null だったので出なかった)
    const member =
        methodCall.kind === 'method' ? methodCall.value.getFields().value : methodCall.kind;

    return makeNodeJson<MethodCallJson>('memberAccess', target, {
        type: 'method',
        member: member,
        ...(memberArg ? { memberArg: memberArg } : {}),
    });
};

export type InstanceNameJson = {
    collection: string[];
    generic?: (TypeJson | ErrorJson)[];
};

export const makeInstanceNameJson = (target: CreatedNameTypeClass): InstanceNameJson => {
    const pairs = target.getFields().value;
    const collection = pairs.map((pair) => pair.getFields().left.getFields().value);

    // 型引数は最後の名前のものだけを見る
    const generic = pairs.at(-1)?.getFields().right ?? null;
    const genericTypes = generic ? generic.getFields().value : [];

    return {
        collection: collection,
        ...(genericTypes.length > 0
            ? {
                  generic: genericTypes.map((v) => {
                      return makeTypeJson(v);
                  }),
              }
            : {}),
    };
};

export type ArrayInitInstanceJson = {
    initType: 'array';
    init?: (BaseExpressionJson | ErrorJson)[];
    size?: BaseExpressionJson | ErrorJson;
};

export type ClassInitInstanceJson = {
    initType: 'class';
    arg?: (BaseExpressionJson | ErrorJson)[];
};

export type MapInitInstanceJson = {
    initType: 'map';
    init?: (
        | {
              key: BaseExpressionJson | ErrorJson;
              value: BaseExpressionJson | ErrorJson;
          }
        | ErrorJson
    )[];
};

export type NoInitInstanceJson = {
    initType: 'no';
    value: string;
};

export type SetInitInstanceJson = {
    initType: 'list || set';
    init?: (BaseExpressionJson | ErrorJson)[];
};

export type InitInstanceJson =
    | ArrayInitInstanceJson
    | ClassInitInstanceJson
    | MapInitInstanceJson
    | NoInitInstanceJson
    | SetInitInstanceJson;

export const makeInitInstanceJson = (target: CreatorRestTypeClass): InitInstanceJson => {
    switch (target.kind) {
        case 'arrayCreatorRest': {
            const rest = target.getFields();
            // `new X[n]` は size、`new X[]{ ... }` は init。`new X[]` (初期化子なし) はどちらも持たない
            if (rest.kind === 'sized') {
                return { initType: 'array', size: makeExpressionJsonConvert(rest.size) };
            }
            return {
                initType: 'array',
                ...(rest.initializer
                    ? {
                          init: rest.initializer
                              .getFields()
                              .element.map((v) => makeExpressionJsonConvert(v)),
                      }
                    : {}),
            };
        }
        case 'classCreatorRest': {
            const elements = target.getFields().value.getFields().elements;
            if (!elements) {
                return { initType: 'class' };
            }
            return { initType: 'class', arg: makeExpressionListJson(elements) };
        }
        case 'mapCreatorRest': {
            const pairs = target.getFields().value;
            return {
                initType: 'map',
                ...(pairs.length > 0
                    ? {
                          init: pairs.map((v) => {
                              const { left, right } = v.getFields();
                              return {
                                  key: makeExpressionJsonConvert(left),
                                  value: makeExpressionJsonConvert(right),
                              };
                          }),
                      }
                    : {}),
            };
        }
        case 'noRest':
            return {
                initType: 'no',
                value: target.getFields().value,
            };
        case 'setCreatorRest':
            // v1 と同じく、要素が 0 個でも init (空の配列) を持つ
            return {
                initType: 'list || set',
                init: target.getFields().value.map((v) => makeExpressionJsonConvert(v)),
            };
    }
};

/**
 * kind を持たない式の位置。kind を持たないので JSON ノード (Diff の対象のノード) ではないが、
 * findings の位置 (ハードコードされた ID など) を式の単位で指せるように持つ。Diff の値の比較では無視する
 */
export type ExpressionValueKeys = { sourceKeys: ConvertKeys };

const valueKeysOf = (target: BasedExpressionTypeClass): ExpressionValueKeys => ({
    sourceKeys: keysOf(target),
});

export type NewInstanceJson = InstanceNameJson & InitInstanceJson & ExpressionValueKeys;

const makeNewInstanceJson = (target: NewExpressionTypeClass): NewInstanceJson => {
    const creator = target.getFields().value.getFields();
    return {
        ...valueKeysOf(target),
        ...makeInstanceNameJson(creator.value),
        ...makeInitInstanceJson(creator.content),
    };
};

export type CastJson = ExpressionValueKeys & {
    target: BaseExpressionJson | ErrorJson;
    convertType: TypeJson | ErrorJson;
};

const makeCastJson = (target: CastExpressionTypeClass): CastJson => {
    const { value, valueType } = target.getFields();
    const typeJson = makeTypeJson(valueType);
    return {
        ...valueKeysOf(target),
        target: makeExpressionJsonConvert(value),
        convertType: typeJson,
    };
};

export type SubJson = ExpressionValueKeys & {
    value: BaseExpressionJson | ErrorJson;
    parentheses: '()';
};

const makeSubJson = (target: SubExpressionTypeClass): SubJson => {
    return {
        ...valueKeysOf(target),
        value: makeExpressionJsonConvert(target.getFields().value),
        parentheses: '()',
    };
};

export type ArrayJson = ExpressionValueKeys & {
    variant: BaseExpressionJson | ErrorJson;
    index: BaseExpressionJson | ErrorJson;
};

const makeArrayJson = (target: ArrayExpressionTypeClass): ArrayJson => {
    const { value, index } = target.getFields();
    return {
        ...valueKeysOf(target),
        variant: makeExpressionJsonConvert(value),
        index: makeExpressionJsonConvert(index),
    };
};

export type FormulaJson = ExpressionValueKeys & {
    left: BaseExpressionJson | ErrorJson;
    operator:
        | '*'
        | '/'
        | '+'
        | '-'
        | '='
        | '+='
        | '-='
        | '*='
        | '/='
        | '&='
        | '|='
        | '^='
        | '>>='
        | '>>>='
        | '<<='
        | '&'
        | '^'
        | '|'
        | '??'
        | '==='
        | '!=='
        | '=='
        | '!='
        | '<>'
        | '&&'
        | '||'
        | '~'
        | '!'
        | string;
    right: BaseExpressionJson | ErrorJson;
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

const makeFormulaJson = (target: FormulaExpressionTypeClass): FormulaJson => {
    const { left, operator, right } = target.getFields();
    return {
        ...valueKeysOf(target),
        left: makeExpressionJsonConvert(left),
        operator: operator,
        right: makeExpressionJsonConvert(right),
    };
};

export type InstanceofJson = ExpressionValueKeys & {
    target: BaseExpressionJson | ErrorJson;
    operator: 'instanceof';
    type: TypeJson | ErrorJson;
};

const makeInstanceofJson = (target: InstanceOfExpressionTypeClass): InstanceofJson => {
    const { left, operator, right } = target.getFields();
    const typeJson = makeTypeJson(right);

    return {
        ...valueKeysOf(target),
        target: makeExpressionJsonConvert(left),
        operator: operator,
        type: typeJson,
    };
};

export type UnaryJson = ExpressionValueKeys & {
    variant: BaseExpressionJson | ErrorJson;
} & {
    operator: '~' | '!' | '++' | '--' | '+' | '-';
    operatorLocation: 'front' | 'back';
};

type UnaryExpressionTypeClass =
    PreOpExpressionTypeClass | PostOpExpressionTypeClass | NegExpressionTypeClass;

const makeUnaryJson = (target: UnaryExpressionTypeClass): UnaryJson => {
    const { value, operator } = target.getFields();
    return {
        ...valueKeysOf(target),
        variant: makeExpressionJsonConvert(value),
        operator: operator,
        operatorLocation: target.kind === 'postOpExpression' ? 'back' : 'front',
    };
};

export type TernaryJson = ExpressionValueKeys & {
    condition: BaseExpressionJson | ErrorJson;
    trueValue: BaseExpressionJson | ErrorJson;
    falseValue: BaseExpressionJson | ErrorJson;
};

const makeTernaryJson = (target: CondExpressionTypeClass): TernaryJson => {
    const { condition, trueValue, falseValue } = target.getFields();
    return {
        ...valueKeysOf(target),
        condition: makeExpressionJsonConvert(condition),
        trueValue: makeExpressionJsonConvert(trueValue),
        falseValue: makeExpressionJsonConvert(falseValue),
    };
};

export type BaseExpressionJson =
    | string
    | PrimaryJson
    | DotMethodCallJson
    | MethodCallJson
    | NewInstanceJson
    | CastJson
    | SubJson
    | ArrayJson
    | FormulaJson
    | InstanceofJson
    | UnaryJson
    | TernaryJson;

export const makeExpressionJsonConvert = (target: BasedExpressionTypeClass): BaseExpressionJson => {
    switch (target.kind) {
        case 'expression':
            return makeExpressionJson(target);
        case 'primaryExpression':
            return makePrimaryJson(target.getFields().value);
        case 'dotExpression':
            return makeDotMethodCallJson(target);
        case 'methodCallExpression':
            return makeMethodCallJson(target);
        case 'newExpression':
            return makeNewInstanceJson(target);
        case 'castExpression':
            return makeCastJson(target);
        case 'subExpression':
            return makeSubJson(target);
        case 'arrayExpression':
            return makeArrayJson(target);
        case 'instanceOfExpression':
            return makeInstanceofJson(target);
        case 'condExpression':
            return makeTernaryJson(target);
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
            return makeFormulaJson(target);
    }
};
