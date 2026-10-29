import {
    ConvertType,
    ConvertWithError,
    ErrorJson,
    isErrorJson,
    isErrorNode,
    makeErrorJson,
    JsonType,
    makeJsonType,
    ConvertKeys,
} from './commons';

import {
    ArrayCreatorRestType,
    ArrayExpressionType,
    Arth1ExpressionType,
    Arth2ExpressionType,
    AssignExpressionType,
    BaseExpressionType,
    BitAndExpressionType,
    BitExpressionType,
    BitNotExpressionType,
    BitOrExpressionType,
    CastExpressionType,
    ClassCreatorRestType,
    CmpExpressionType,
    CoalExpressionType,
    CreatedNameType,
    DotExpressionType,
    EqualityExpressionType,
    ExpressionListType,
    ExpressionType,
    LogAndExpressionType,
    LogOrExpressionType,
    MapCreatorRestType,
    MethodCallExpressionType,
    NewExpressionType,
    NegExpressionType,
    NoRestType,
    PostOpExpressionType,
    PreOpExpressionType,
    SetCreatorRestType,
    SubExpressionType,
    InstanceOfExpressionType,
    CondExpressionType,
} from './converter';
import { makeTypeJson, TypeJson } from './type';
import { PrimaryJson, makePrimaryJson } from './primary';

const ERROR_KIND = 'expression';

const makeExpressionJson = (target: ConvertWithError<ExpressionType>): string => {
    return target.value;
};

const makeExpressionListJson = (
    target: ConvertType<ExpressionListType>,
): (BaseExpressionJson | ErrorJson)[] | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    return target.value.map((v) => makeExpressionJsonConvert(v));
};

export type DotMethodCallJson = JsonType<'memberAccess'> & {
    type: 'object' | 'method';
    object: BaseExpressionJson | ErrorJson;
    operator: '.' | '?.';
    member: string;
    memberArg?: (BaseExpressionJson | ErrorJson)[] | ErrorJson;
};

const makeDotMethodCallJson = (
    target: ConvertWithError<DotExpressionType>,
): DotMethodCallJson | ErrorJson => {
    const object = makeExpressionJsonConvert(target.left);
    const operator = target.operator;
    const right = target.right;

    if (isErrorNode(right)) {
        return makeErrorJson(right, ERROR_KIND);
    }

    const targetRecords: ConvertKeys = { objectKey: target.objectKey, sourceKey: target.sourceKey };

    if (right.type === 'anyId') {
        return makeJsonType('memberAccess', targetRecords, {
            type: 'object',
            object: object,
            operator: operator,
            member: right.value,
        });
    }

    if (isErrorNode(right.value)) {
        return makeErrorJson(right.value, ERROR_KIND);
    }

    return makeJsonType('memberAccess', targetRecords, {
        type: 'method',
        object: object,
        operator: operator,
        member: right.value.value,
        ...(right.param ? { memberArg: makeExpressionListJson(right.param) } : {}),
    });
};

export type MethodCallJson = JsonType<'memberAccess'> & {
    type: 'method';
    member: 'this' | 'super' | string;
    memberArg?: (BaseExpressionJson | ErrorJson)[] | ErrorJson;
    ref?: 'this' | 'super';
};

const makeMethodCallJson = (
    target: ConvertWithError<MethodCallExpressionType>,
): MethodCallJson | ErrorJson => {
    const methodCall = target.value;
    if (isErrorNode(methodCall)) {
        return makeErrorJson(methodCall, ERROR_KIND);
    }

    const memberArg = methodCall.param ? makeExpressionListJson(methodCall.param) : null;

    const targetRecords: ConvertKeys = { objectKey: target.objectKey, sourceKey: target.sourceKey };

    if (typeof methodCall.value === 'string') {
        return makeJsonType('memberAccess', targetRecords, {
            type: 'method',
            member: methodCall.value,
            ...(memberArg ? { memberArg: memberArg } : {}),
        });
    }

    if (isErrorNode(methodCall.value)) {
        return makeErrorJson(methodCall.value, ERROR_KIND);
    }

    return makeJsonType('memberAccess', targetRecords, {
        type: 'method',
        member: methodCall.value.value,
        ...(memberArg ? { memberArg: memberArg } : {}),
        ...('reference' in methodCall && methodCall.reference ? { ref: methodCall.reference } : {}),
    });
};

type InstanceNameJson = {
    collection: string[];
    generic?: (TypeJson | ErrorJson)[];
};

export const makeInstanceNameJson = (
    target: ConvertType<CreatedNameType>,
): InstanceNameJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const collection: string[] = [];
    for (const pair of target.value) {
        if (isErrorNode(pair)) {
            return makeErrorJson(pair, ERROR_KIND);
        }
        if (isErrorNode(pair.left)) {
            return makeErrorJson(pair.left, ERROR_KIND);
        }
        collection.push(pair.left.value);
    }

    const lastPair = target.value.at(-1);
    const generic = lastPair && !isErrorNode(lastPair) ? lastPair.right : null;
    if (generic && isErrorNode(generic)) {
        return makeErrorJson(generic, ERROR_KIND);
    }

    return {
        collection: collection,
        ...(generic && generic.value.length > 0
            ? {
                  generic: generic.value.map((v) => {
                      return makeTypeJson(v);
                  }),
              }
            : {}),
    };
};

type ArrayInitInstanceJson = {
    kind: 'array';
    init?: (BaseExpressionJson | ErrorJson)[];
    size?: BaseExpressionJson | ErrorJson;
};

type ClassInitInstanceJson = {
    kind: 'class';
    arg?: (BaseExpressionJson | ErrorJson)[];
};

type MapInitInstanceJson = {
    kind: 'map';
    init?: (
        | {
              key: BaseExpressionJson | ErrorJson;
              value: BaseExpressionJson | ErrorJson;
          }
        | ErrorJson
    )[];
};

type NoInitInstanceJson = {
    kind: 'no';
    value: string;
};

type SetInitInstanceJson = {
    kind: 'list || set';
    init?: (BaseExpressionJson | ErrorJson)[];
};

type InitInstanceJson =
    | ArrayInitInstanceJson
    | ClassInitInstanceJson
    | MapInitInstanceJson
    | NoInitInstanceJson
    | SetInitInstanceJson;

export const makeInitInstanceJson = (
    target: ConvertType<
        | ArrayCreatorRestType
        | ClassCreatorRestType
        | MapCreatorRestType
        | NoRestType
        | SetCreatorRestType
    >,
): InitInstanceJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    if (target.type === 'arrayCreatorRest') {
        if (target.value && isErrorNode(target.value)) {
            return makeErrorJson(target.value, ERROR_KIND);
        }
        return {
            kind: 'array',
            ...(target.value
                ? {
                      init: target.value.value.map((v) => makeExpressionJsonConvert(v)),
                  }
                : {}),
            ...(target.size ? { size: makeExpressionJsonConvert(target.size) } : {}),
        };
    } else if (target.type === 'classCreatorRest') {
        if (isErrorNode(target.value)) {
            return makeErrorJson(target.value, ERROR_KIND);
        }
        if (!target.value.value) {
            return { kind: 'class' };
        }
        const arg = makeExpressionListJson(target.value.value);
        return Array.isArray(arg) ? { kind: 'class', arg: arg } : arg;
    } else if (target.type === 'mapCreatorRest') {
        return {
            kind: 'map',
            ...(target.value.length > 0
                ? {
                      init: target.value.map((v) => {
                          if (isErrorNode(v)) {
                              return makeErrorJson(v, ERROR_KIND);
                          }
                          return {
                              key: makeExpressionJsonConvert(v.left),
                              value: makeExpressionJsonConvert(v.right),
                          };
                      }),
                  }
                : {}),
        };
    } else if (target.type === 'noRest') {
        return {
            kind: 'no',
            value: target.value,
        };
    } else {
        return {
            kind: 'list || set',
            ...(target.value
                ? {
                      init: target.value.map((v) => makeExpressionJsonConvert(v)),
                  }
                : {}),
        };
    }
};

type NewInstanceJson = InstanceNameJson & InitInstanceJson;

const makeNewInstanceJson = (
    target: ConvertWithError<NewExpressionType>,
): NewInstanceJson | ErrorJson => {
    const creator = target.value;
    if (isErrorNode(creator)) {
        return makeErrorJson(creator, ERROR_KIND);
    }

    const instanceName = makeInstanceNameJson(creator.value);
    if (isErrorJson(instanceName)) {
        return instanceName;
    }

    const initInstance = makeInitInstanceJson(creator.rest);
    if (isErrorJson(initInstance)) {
        return initInstance;
    }

    return {
        ...instanceName,
        ...initInstance,
    };
};

type CastJson = {
    target: BaseExpressionJson | ErrorJson;
    convertType: TypeJson | ErrorJson;
};

const makeCastJson = (target: ConvertWithError<CastExpressionType>): CastJson => {
    const typeJson = makeTypeJson(target.valueType);
    return {
        target: makeExpressionJsonConvert(target.value),
        convertType: typeJson,
    };
};

type SubJson = {
    value: BaseExpressionJson | ErrorJson;
    parentheses: '()';
};

const makeSubJson = (target: ConvertWithError<SubExpressionType>): SubJson => {
    return {
        value: makeExpressionJsonConvert(target.value),
        parentheses: '()',
    };
};

type ArrayJson = {
    variant: BaseExpressionJson | ErrorJson;
    index: BaseExpressionJson | ErrorJson;
};

const makeArrayJson = (target: ConvertWithError<ArrayExpressionType>): ArrayJson => {
    return {
        variant: makeExpressionJsonConvert(target.value),
        index: makeExpressionJsonConvert(target.index),
    };
};

type FormulaJson = {
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

type FormulaExpressionType =
    | Arth1ExpressionType
    | Arth2ExpressionType
    | AssignExpressionType
    | BitAndExpressionType
    | BitExpressionType
    | BitNotExpressionType
    | BitOrExpressionType
    | CmpExpressionType
    | CoalExpressionType
    | EqualityExpressionType
    | LogAndExpressionType
    | LogOrExpressionType;

const makeFormulaJson = (target: ConvertWithError<FormulaExpressionType>): FormulaJson => {
    return {
        left: makeExpressionJsonConvert(target.left),
        operator: target.operator,
        right: makeExpressionJsonConvert(target.right),
    };
};

type InstanceofJson = {
    target: BaseExpressionJson | ErrorJson;
    operator: 'instanceof';
    type: TypeJson | ErrorJson;
};

const makeInstanceofJson = (target: ConvertWithError<InstanceOfExpressionType>): InstanceofJson => {
    const typeJson = makeTypeJson(target.right);

    return {
        target: makeExpressionJsonConvert(target.left),
        operator: target.operator,
        type: typeJson,
    };
};

type UnaryJson = {
    variant: BaseExpressionJson | ErrorJson;
} & {
    operator: '~' | '!' | '++' | '--' | '+' | '-';
    operatorLocation: 'front' | 'back';
};

type UnaryExpressionType = PreOpExpressionType | PostOpExpressionType | NegExpressionType;

const makeUnaryJson = (target: ConvertWithError<UnaryExpressionType>): UnaryJson => {
    return {
        variant: makeExpressionJsonConvert(target.value),
        operator: target.operator,
        operatorLocation: target.type === 'postOpExpression' ? 'back' : 'front',
    };
};

type TernaryJson = {
    condition: BaseExpressionJson | ErrorJson;
    trueValue: BaseExpressionJson | ErrorJson;
    falseValue: BaseExpressionJson | ErrorJson;
};

const makeTernaryJson = (target: ConvertWithError<CondExpressionType>): TernaryJson => {
    return {
        condition: makeExpressionJsonConvert(target.condition),
        trueValue: makeExpressionJsonConvert(target.trueValue),
        falseValue: makeExpressionJsonConvert(target.falseValue),
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

export const makeExpressionJsonConvert = (
    target: ConvertType<BaseExpressionType>,
): BaseExpressionJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    if (target.type === 'expression') {
        return makeExpressionJson(target);
    } else if (target.type === 'primaryExpression') {
        return makePrimaryJson(target.value);
    } else if (target.type === 'dotExpression') {
        return makeDotMethodCallJson(target);
    } else if (target.type === 'methodCallExpression') {
        return makeMethodCallJson(target);
    } else if (target.type === 'newExpression') {
        return makeNewInstanceJson(target);
    } else if (target.type === 'castExpression') {
        return makeCastJson(target);
    } else if (target.type === 'subExpression') {
        return makeSubJson(target);
    } else if (target.type === 'arrayExpression') {
        return makeArrayJson(target);
    } else if (target.type === 'instanceOfExpression') {
        return makeInstanceofJson(target);
    } else if (target.type === 'condExpression') {
        return makeTernaryJson(target);
    } else if (
        target.type === 'preOpExpression' ||
        target.type === 'postOpExpression' ||
        target.type === 'negExpression'
    ) {
        return makeUnaryJson(target);
    } else {
        return makeFormulaJson(target);
    }
};
