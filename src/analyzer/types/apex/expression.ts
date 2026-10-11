import {
    Expression,
    Primary,
    DotExpression,
    MethodCall,
    Creator,
    IdCreatedNamePair,
    ArrayCreatorRest,
    MapCreatorRestPair,
    CastExpression,
    SingleOperatorExpression,
    ExpToExpOperatorExpression,
    InstanceOfExpression,
    CondExpression,
} from './converter';

import { PrimaryType, makePrimaryType } from './primary';
import { TypeType, makeTypeType } from './type';

type DotExpressionType = {
    object: ExpressionType;
    operator: string;
    member:
        | {
              kind: 'field';
              name: string;
          }
        | {
              kind: 'method';
              name: string;
              arg: ExpressionType[];
          };
};

type MethodCallType = {
    name?: string;
    arg: ExpressionType[];
    isSuper: boolean;
    isThis: boolean;
};

type CreatedNameType = {
    typeName: string[];
    generic?: TypeType[];
};

type ArrayCreatorRestType = CreatedNameType & {
    size?: ExpressionType;
    initValue?: ExpressionType[];
};

type ClassCreatorRestType = CreatedNameType & {
    arg?: ExpressionType[];
};

type MapCreatorRestType = CreatedNameType & {
    initValue?: {
        key: ExpressionType;
        value: ExpressionType;
    }[];
};

type SetCreatorRestType = CreatedNameType & {
    initialValue?: ExpressionType[];
};

type CreatorType =
    | CreatedNameType
    | ArrayCreatorRestType
    | ClassCreatorRestType
    | MapCreatorRestType
    | SetCreatorRestType;

type CastType = {
    value: ExpressionType;
    convertTo: TypeType;
};

type SubType = {
    value: ExpressionType;
    parenthesized: true;
};

type SingleOperatorType = {
    value: ExpressionType;
    operator: string;
    location: 'prefix' | 'postfix';
};

type DoubleOperatorType = {
    left: ExpressionType;
    operator: string;
    right: ExpressionType;
};

type InstanceOfType = {
    value: ExpressionType;
    operator: string;
    targetType: TypeType;
};

type CondType = {
    condition: ExpressionType;
    truevalue: ExpressionType;
    falseValue: ExpressionType;
};

export type ExpressionType =
    | string
    | PrimaryType
    | ExpressionType[]
    | DotExpressionType
    | MethodCallType
    | CreatorType
    | CastType
    | SubType
    | SingleOperatorType
    | DoubleOperatorType
    | InstanceOfType
    | CondType
    | 'unSupported';

export const makeExpressionType = (expression: Expression): ExpressionType => {
    const { type, expression: value } = expression;

    if (type === 'normal' && value) {
        return value;
    }

    if (type === 'primary' && value) {
        return makePrimaryType(value);
    }

    if (type === 'dot') {
        const { left, operator, right } = value;

        if (left && operator && right) {
            const object = makeExpressionType(expression);

            let member:
                | {
                      kind: 'field';
                      name: string;
                  }
                | {
                      kind: 'method';
                      name: string;
                      arg: ExpressionType[];
                  }
                | undefined = undefined;
            if (typeof right === 'string') {
                member = {
                    kind: 'field',
                    name: right,
                };
            } else {
                const { value: name, param: arg } = right;
                if (name) {
                    member = {
                        kind: 'method',
                        name: name,
                        arg: arg.map((a) => makeExpressionType(a)),
                    };
                }
            }

            if (member !== undefined) {
                return {
                    object: object,
                    operator: operator,
                    member: member,
                };
            }
        }
    }

    if (type === 'array') {
        return value.map((v) => makeExpressionType(v));
    }

    if (type === 'methodCall') {
        const { value: name, param: arg, reference } = value;

        const expressionType: MethodCallType = {
            arg: arg.map((a) => makeExpressionType(a)),
            isSuper: reference?.toLowerCase() === 'super',
            isThis: reference?.toLowerCase() === 'this',
        };

        if (name) {
            expressionType.name = name;
        }

        return expressionType;
    }

    if (type === 'new' && value) {
        const { type: creatorType, value: idCreatedNamePairs, content } = value;

        let createdName: CreatedNameType | undefined = undefined;
        const typeName: string[] = [];
        let generic: TypeType[] | undefined = undefined;

        idCreatedNamePairs.forEach((i, index) => {
            const { left, right } = i;
            if (left) {
                typeName.push(left);
            }

            if (right.length !== 0 && idCreatedNamePairs.length === index + 1) {
                generic = right.map((r) => makeTypeType(r));
            }
        });

        if (typeName.length > 0) {
            createdName = {
                typeName: typeName,
            };
            if (generic) {
                createdName.generic = generic;
            }
        }

        if (createdName) {
            if (creatorType === 'array') {
                const { value: initialValue, size: size } = content;
                const expressionType: ArrayCreatorRestType = {
                    ...createdName,
                };

                if (size) {
                    expressionType.size = makeExpressionType(size);
                }
                if (initialValue.length > 0) {
                    expressionType.initValue = initialValue.map((i) => makeExpressionType(i));
                }

                return expressionType;
            }

            if (creatorType === 'class') {
                const expressionType: ClassCreatorRestType = {
                    ...createdName,
                };

                if (content.length > 0) {
                    expressionType.arg = content.map((a) => makeExpressionType(a));
                }

                return expressionType;
            }

            if (creatorType === 'map') {
                const expressionType: MapCreatorRestType = {
                    ...createdName,
                };

                if (content.length > 0) {
                    const initialValue: {
                        key: ExpressionType;
                        value: ExpressionType;
                    }[] = [];

                    content.forEach((c) => {
                        const { left, right } = c;
                        if (left && right) {
                            initialValue.push({
                                key: makeExpressionType(left),
                                value: makeExpressionType(left),
                            });
                        }
                    });

                    expressionType.initValue = initialValue;
                }

                return expressionType;
            }

            if (creatorType === 'no') {
                return createdName;
            }

            if (creatorType === 'set') {
                const expressionType: SetCreatorRestType = {
                    ...createdName,
                };

                if (content.length > 0) {
                    expressionType.initialValue = content.map((c) => makeExpressionType(c));
                }

                return expressionType;
            }
        }
    }

    if (type === 'cast') {
        const { value: valueValue, valueType } = value;
        if (valueValue && valueType) {
            return {
                value: makeExpressionType(valueValue),
                convertTo: makeTypeType(valueType),
            };
        }
    }

    if (type === 'sub' && value) {
        return {
            value: makeExpressionType(value),
            parenthesized: true,
        };
    }

    if (type === 'postOp' || type === 'preOp' || type == 'neg') {
        const { value: valueValue, operator, location } = value;
        if (valueValue) {
            return {
                value: makeExpressionType(valueValue),
                operator: operator,
                location: location,
            };
        }
    }

    if (
        type === 'arth1' ||
        type === 'arth2' ||
        type === 'bit' ||
        type === 'equality' ||
        type === 'bitAnd' ||
        type === 'bitOr' ||
        type === 'bitNot' ||
        type === 'assign' ||
        type === 'cmp' ||
        type === 'logAnd' ||
        type === 'logOr' ||
        type === 'coal'
    ) {
        const { left, operator, right } = value;

        if (left && operator && right) {
            return {
                left: makeExpressionType(left),
                operator: operator,
                right: makeExpressionType(right),
            };
        }
    }

    if (type === 'instanceOf') {
        const { left, operator, right } = value;

        if (left && operator && right) {
            return {
                value: makeExpressionType(left),
                operator: operator,
                targetType: makeTypeType(right),
            };
        }
    }

    if (type === 'cond') {
        const { condition, true: trueValue, false: falseValue } = value;

        if (condition && trueValue && falseValue) {
            return {
                condition: makeExpressionType(condition),
                truevalue: makeExpressionType(trueValue),
                falseValue: makeExpressionType(falseValue),
            };
        }
    }

    return 'unSupported';
};
