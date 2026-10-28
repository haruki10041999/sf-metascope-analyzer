import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ConvertType,
    convertValue,
    ErrorJson,
    JsonType,
    makeJsonType,
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
    DotMethodCallType,
    EqualityExpressionType,
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

const makeExpressionJson = (target: ConvertExcludeError<ExpressionType>): string => {
    return target.value;
};

export type DotMethodCallJson = {
    object: BaseExpressionJson | ErrorJson;
    operator: '.' | '?.';
    member: string;
    memberArg?: (BaseExpressionJson | ErrorJson)[];
};

const makeDotMethodCallJson = (
    target: ConvertExcludeError<DotExpressionType>,
): DotMethodCallJson => {
    const object = makeExpressionJsonConvert(target.left);
    const operator = target.operator;

    if (target.right.type === 'anyId') {
        return {
            object: object,
            operator: operator,
            member: target.right.value,
        };
    } else {
        const member = target.right.value.value;
        const memberArg = target.right.param
            ? target.right.param.value.map((v) => {
                  return makeExpressionJsonConvert(v);
              })
            : null;

        return {
            object: object,
            operator: operator,
            member: member,
            ...(memberArg ? { memberArg: memberArg } : {}),
        };
    }
};

export type MethodCallJson = {
    member: 'this' | 'super' | string;
    memberArg?: (BaseExpressionJson | ErrorJson)[];
    ref?: 'this' | 'super';
};

const makeMethodCallJson = (
    target: ConvertExcludeError<MethodCallExpressionType>,
): MethodCallJson => {
    const memberArg = target.value.param
        ? target.value.param.value.map((v) => {
              return makeExpressionJsonConvert(v);
          })
        : null;

    if (typeof target.value.value === 'string') {
        return {
            member: target.value.value,
            ...(memberArg ? { memberArg: memberArg } : {}),
        };
    } else {
        return {
            member: target.value.value.value,
            ...(memberArg ? { memberArg: memberArg } : {}),
            ...(target.value.reference ? { ref: target.value.reference } : {}),
        };
    }
};

type InstanceNameJson = {
    collection: string[];
    generic?: (TypeJson | ErrorJson)[];
};

export const makeInstanceNameJson = (
    target: ConvertExcludeError<CreatedNameType>,
): InstanceNameJson => {
    const generic = target.value.at(-1)?.right;
    return {
        collection: target.value.map((v) => v.left.value),
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
    init?: (BaseExpressionJson | ErrorJson)[];
    size?: BaseExpressionJson | ErrorJson;
};

type ClassInitInstanceJson = {
    arg?: (BaseExpressionJson | ErrorJson)[];
};

type MapInitInstanceJson = {
    init?: {
        key: BaseExpressionJson | ErrorJson;
        value: BaseExpressionJson | ErrorJson;
    }[];
};

type NoInitInstanceJson = {
    value: string;
};

type SetInitInstanceJson = {
    init?: (BaseExpressionJson | ErrorJson)[];
};

export const makeInitInstanceJson = (
    target: ConvertExcludeError<
        | ArrayCreatorRestType
        | ClassCreatorRestType
        | MapCreatorRestType
        | NoRestType
        | SetCreatorRestType
    >,
):
    | ArrayInitInstanceJson
    | ClassInitInstanceJson
    | MapInitInstanceJson
    | NoInitInstanceJson
    | SetInitInstanceJson => {
    if (target.type === 'arrayCreatorRest') {
        return {
            ...(target.value
                ? {
                      init: target.value.value.map((v) => makeExpressionJsonConvert(v)),
                  }
                : {}),
            ...(target.size ? { size: makeExpressionJsonConvert(target.size) } : {}),
        };
    } else if (target.type === 'classCreatorRest') {
        return {
            ...(target.value.value
                ? {
                      arg: target.value.value.value.map((v) => makeExpressionJsonConvert(v)),
                  }
                : {}),
        };
    } else if (target.type === 'mapCreatorRest') {
        return {
            ...(target.value.length > 0
                ? {
                      init: target.value.map((v) => {
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
            value: target.value,
        };
    } else {
        return {
            ...(target.value
                ? {
                      init: target.value.map((v) => makeExpressionJsonConvert(v)),
                  }
                : {}),
        };
    }
};

type NewInstanceJson = InstanceNameJson &
    (
        | ArrayInitInstanceJson
        | ClassInitInstanceJson
        | MapInitInstanceJson
        | NoInitInstanceJson
        | SetInitInstanceJson
    );

const makeNewInstanceJson = (target: ConvertExcludeError<NewExpressionType>): NewInstanceJson => {
    return {
        ...makeInstanceNameJson(target.value.value),
        ...makeInitInstanceJson(target.value.rest),
    };
};

type CastJson = {
    target: BaseExpressionJson | ErrorJson;
    convertType: TypeJson | ErrorJson;
};

const makeCastJson = (target: ConvertExcludeError<CastExpressionType>): CastJson => {
    const typeJson = makeTypeJson(target.valueType);
    return {
        target: makeExpressionJsonConvert(target.value),
        convertType: typeJson,
    };
};

type SubJson = {
    value: BaseExpressionJson | ErrorJson;
    parentheSize: '()';
};

const makeSubJson = (target: ConvertExcludeError<SubExpressionType>): SubJson => {
    return {
        value: makeExpressionJsonConvert(target.value),
        parentheSize: '()',
    };
};

type ArrayJson = {
    variant: BaseExpressionJson | ErrorJson;
    index: BaseExpressionJson | ErrorJson;
};

const makeArrayJson = (target: ConvertExcludeError<ArrayExpressionType>): ArrayJson => {
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

const makeFormulaJson = (target: ConvertExcludeError<FormulaExpressionType>): FormulaJson => {
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

const makeInstanceofJson = (
    target: ConvertExcludeError<InstanceOfExpressionType>,
): InstanceofJson => {
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

const makeUnaryJson = (target: ConvertExcludeError<UnaryExpressionType>): UnaryJson => {
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

const makeTernaryJson = (target: ConvertExcludeError<CondExpressionType>): TernaryJson => {
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
    target: ConvertExcludeError<BaseExpressionType>,
): BaseExpressionJson | ErrorJson => {
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
