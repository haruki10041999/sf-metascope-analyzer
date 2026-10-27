import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
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

const omitSourceKeys = <T extends { sourceKeys: Record<string, string[]> }>(
    target: T,
): Omit<T, 'sourceKeys'> => {
    const { sourceKeys: _sourceKeys, ...content } = target;
    return content;
};

export type ExpressionJson = JsonType<'expression'> & {
    value: string;
};

const makeExpressionJson = (target: ConvertExcludeError<ExpressionType>): ExpressionJson => {
    const targetRecord: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };
    return makeJsonType('expression', targetRecord, { value: target.value });
};

export type DotMethodCallJson = JsonType<'methodCall'> & {
    object: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    operator: '.' | '?.';
    member: string;
    memberArg?: string;
};

const makeDotMethodCallJson = (
    target: Convert<DotExpressionType>,
    targetRecords?: Record<string, string[]>,
): DotMethodCallJson | ErrorJson => {
    return convertValue<'dotExpression', 'methodCall', DotExpressionType, DotMethodCallJson>(
        ['dotExpression'],
        target,
        ['methodCall'],
        'methodCall',
        (target, targetRecords, _errorJson) => {
            const { sourceKeys, ...object } = makeExpressionJsonConvert(target.left);
            const operator = target.operator;

            if (target.right.type === 'anyId') {
                return makeJsonType('methodCall', targetRecords, {
                    object: object,
                    operator: operator,
                    member: target.right.value,
                });
            } else {
                const member = target.right.value;
                const memberArg = target.right.param
                    ? target.right.param.value.map((v) => {
                          const { sourceKeys, ...arg } = makeExpressionJsonConvert(v);
                          return arg;
                      })
                    : null;

                return makeJsonType('methodCall', targetRecords, {
                    object: object,
                    operator: operator,
                    member: member,
                    ...(memberArg ? { memberArg: memberArg } : {}),
                });
            }
        },
        targetRecords,
    );
};

export type MethodCallJson = JsonType<'methodCall'> & {
    member: 'this' | 'super' | string;
    memberArg?: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>[];
    ref?: 'this' | 'super';
};

const makeMethodCallJson = (
    target: Convert<MethodCallExpressionType>,
    targetRecords?: Record<string, string[]>,
): MethodCallJson | ErrorJson => {
    return convertValue<
        'methodCallExpression',
        'methodCall',
        MethodCallExpressionType,
        MethodCallJson
    >(
        ['methodCallExpression'],
        target,
        ['methodCall'],
        'methodCall',
        (target, targetRecords, _errorJson) => {
            const memberArg = target.value.param
                ? target.value.param.value.map((v) => {
                      const { sourceKeys, ...arg } = makeExpressionJsonConvert(v);
                      return arg;
                  })
                : null;

            if (typeof target.value.value === 'string') {
                return makeJsonType('methodCall', targetRecords, {
                    member: target.value.value,
                    ...(memberArg ? { memberArg: memberArg } : {}),
                });
            } else {
                return makeJsonType('methodCall', targetRecords, {
                    member: target.value.value.value,
                    ...(memberArg ? { memberArg: memberArg } : {}),
                    ...(target.value.reference ? { ref: target.value.reference } : {}),
                });
            }
        },
        targetRecords,
    );
};

type InstanceNameJson = {
    collection: string[];
    generic?: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>[];
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
                      const { kind, sourceKeys, ...content } = makeTypeJson(v);
                      return content;
                  }),
              }
            : {}),
    };
};

type ArrayInitInstanceJson = {
    init?: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>[];
    size?: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
};

type ClassInitInstanceJson = {
    arg?: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>[];
};

type MapInitInstanceJson = {
    init?: {
        key: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
        value: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    }[];
};

type NoInitInstanceJson = {
    value: string;
};

type SetInitInstanceJson = {
    arg?: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>[];
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
                      init: target.value.value.map((v) =>
                          omitSourceKeys(makeExpressionJsonConvert(v)),
                      ),
                  }
                : {}),
            ...(target.size
                ? { size: omitSourceKeys(makeExpressionJsonConvert(target.size)) }
                : {}),
        };
    } else if (target.type === 'classCreatorRest') {
        return {
            ...(target.value.value
                ? {
                      arg: target.value.value.value.map((v) =>
                          omitSourceKeys(makeExpressionJsonConvert(v)),
                      ),
                  }
                : {}),
        };
    } else if (target.type === 'mapCreatorRest') {
        return {
            ...(target.value.length > 0
                ? {
                      init: target.value.map((v) => {
                          return {
                              key: omitSourceKeys(makeExpressionJsonConvert(v.left)),
                              value: omitSourceKeys(makeExpressionJsonConvert(v.right)),
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
                      init: target.value.map((v) => omitSourceKeys(makeExpressionJsonConvert(v))),
                  }
                : {}),
        };
    }
};

type NewInstanceJson = JsonType<'newInstance'> &
    CreatedNameType &
    (
        | ArrayInitInstanceJson
        | ClassInitInstanceJson
        | MapInitInstanceJson
        | NoInitInstanceJson
        | SetInitInstanceJson
    );

const makeNewInstanceJson = (
    target: Convert<NewExpressionType>,
    targetRecords?: Record<string, string[]>,
): NewInstanceJson | ErrorJson => {
    return convertValue<'newExpression', 'newInstance', NewExpressionType, NewInstanceJson>(
        ['newExpression'],
        target,
        ['newInstance'],
        'newInstance',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('newInstance', targetRecords, {
                ...makeInstanceNameJson(target.value.value),
                ...makeInitInstanceJson(target.value.rest),
            });
        },
        targetRecords,
    );
};

type CastJson = JsonType<'cast'> & {
    target: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    convertType: Omit<TypeJson | ErrorJson, 'sourceKeys'>;
};

const makeCastJson = (
    target: Convert<CastExpressionType>,
    targetRecords?: Record<string, string[]>,
): CastJson | ErrorJson => {
    return convertValue<'castExpression', 'cast', CastExpressionType, CastJson>(
        ['castExpression'],
        target,
        ['cast'],
        'cast',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('cast', targetRecords, {
                target: omitSourceKeys(makeExpressionJsonConvert(target.value)),
                convertType: omitSourceKeys(makeTypeJson(target.valueType)),
            });
        },
        targetRecords,
    );
};

type SubJson = JsonType<'sub'> & {
    value: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    parentheSize: '()';
};

const makeSubJson = (
    target: Convert<SubExpressionType>,
    targetRecords?: Record<string, string[]>,
): SubJson | ErrorJson => {
    return convertValue<'subExpression', 'sub', SubExpressionType, SubJson>(
        ['subExpression'],
        target,
        ['sub'],
        'sub',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('sub', targetRecords, {
                value: omitSourceKeys(makeExpressionJsonConvert(target.value)),
                parentheSize: '()',
            });
        },
        targetRecords,
    );
};

type ArrayJson = JsonType<'array'> & {
    variant: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    index: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
};

const makeArrayJson = (
    target: Convert<ArrayExpressionType>,
    targetRecords?: Record<string, string[]>,
): ArrayJson | ErrorJson => {
    return convertValue<'arrayExpression', 'array', ArrayExpressionType, ArrayJson>(
        ['arrayExpression'],
        target,
        ['array'],
        'array',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('array', targetRecords, {
                variant: omitSourceKeys(makeExpressionJsonConvert(target.value)),
                index: omitSourceKeys(makeExpressionJsonConvert(target.index)),
            });
        },
        targetRecords,
    );
};

type FormulaJson = JsonType<'formula'> & {
    left: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
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
    right: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
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

const makeFormulaJson = (
    target: Convert<FormulaExpressionType>,
    targetRecords?: Record<string, string[]>,
): FormulaJson | ErrorJson => {
    return convertValue<
        FormulaExpressionType['type'],
        'formula',
        FormulaExpressionType,
        FormulaJson
    >(
        [
            'arth1Expression',
            'arth2Expression',
            'assignExpression',
            'bitAndExpression',
            'bitExpression',
            'bitNotExpression',
            'bitOrExpression',
            'cmpExpression',
            'coalExpression',
            'equalityExpression',
            'logAndExpression',
            'logOrExpression',
        ],
        target,
        ['formula'],
        'formula',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('formula', targetRecords, {
                left: omitSourceKeys(makeExpressionJsonConvert(target.left)),
                operator: target.operator,
                right: omitSourceKeys(makeExpressionJsonConvert(target.right)),
            });
        },
        targetRecords,
    );
};

type InstanceofJson = JsonType<'formula'> & {
    target: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    operator: 'instanceof';
    type: Omit<TypeJson | ErrorJson, 'kind' | 'sourceKeys'>;
};

const makeInstanceofJson = (
    target: Convert<InstanceOfExpressionType>,
    targetRecords?: Record<string, string[]>,
): InstanceofJson | ErrorJson => {
    return convertValue<
        'instanceOfExpression',
        'formula',
        InstanceOfExpressionType,
        InstanceofJson
    >(
        ['instanceOfExpression'],
        target,
        ['formula'],
        'formula',
        (target, targetRecords, _errorJson) => {
            const { kind, sourceKeys, ...type } = makeTypeJson(target.right);
            return makeJsonType('formula', targetRecords, {
                target: omitSourceKeys(makeExpressionJsonConvert(target.left)),
                operator: target.operator,
                type: type,
            });
        },
        targetRecords,
    );
};

type UnaryJson = JsonType<'unary'> & {
    variant: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
} & (
        | {
              operator: '~' | '!' | '++' | '--' | '+' | '-';
              operatorLocation: 'front';
          }
        | {
              operator: '++' | '--';
              operatorLocation: 'back';
          }
    );

type UnaryExpressionType = PreOpExpressionType | PostOpExpressionType | NegExpressionType;

const makeUnaryJson = (
    target: Convert<UnaryExpressionType>,
    targetRecords?: Record<string, string[]>,
): UnaryJson | ErrorJson => {
    return convertValue<UnaryExpressionType['type'], 'unary', UnaryExpressionType, UnaryJson>(
        ['preOpExpression', 'postOpExpression', 'negExpression'],
        target,
        ['unary'],
        'unary',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('unary', targetRecords, {
                variant: omitSourceKeys(makeExpressionJsonConvert(target.value)),
                operator: target.operator,
                operatorLocation: target.type === 'postOpExpression' ? 'back' : 'front',
            });
        },
        targetRecords,
    );
};

type TernaryJson = JsonType<'tenary'> & {
    condition: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    trueValue: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
    falseValue: Omit<BaseExpressionJson | ErrorJson, 'sourceKeys'>;
};

const makeTernaryJson = (
    target: Convert<CondExpressionType>,
    targetRecords?: Record<string, string[]>,
): TernaryJson | ErrorJson => {
    return convertValue<'condExpression', 'tenary', CondExpressionType, TernaryJson>(
        ['condExpression'],
        target,
        ['tenary'],
        'tenary',
        (target, targetRecords, _errorJson) => {
            return makeJsonType('tenary', targetRecords, {
                condition: omitSourceKeys(makeExpressionJsonConvert(target.condition)),
                trueValue: omitSourceKeys(makeExpressionJsonConvert(target.trueValue)),
                falseValue: omitSourceKeys(makeExpressionJsonConvert(target.falseValue)),
            });
        },
        targetRecords,
    );
};

export type BaseExpressionJson = ExpressionJson;

export const makeExpressionJsonConvert = (
    target: Convert<BaseExpressionType>,
    targetRecords?: Record<string, string[]>,
): BaseExpressionJson => {
    throw new Error('hoge');
};
