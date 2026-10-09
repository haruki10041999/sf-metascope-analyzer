import { Expression } from './converter';

import { PrimaryType, makePrimary } from './primary';
import { TypeType, makeTypeType } from './type';
import { CreatorType, makeCreatorType } from './creater';

type Normal = string;
type Primary = PrimaryType;
type Dot = {
    object: ExpressionType;
    operator: string;
    property?: string;
    methodName?: string;
    param?: any[];
};
type Array = ExpressionType[];
type MethodCall = {
    methodName: string;
    param?: ExpressionType[];
    isSuper: boolean;
    isThis: boolean;
};
type New = CreatorType;
type Cast = {
    variant: ExpressionType;
    toType: TypeType;
};
type Sub = {
    value: ExpressionType;
    parenthesized: boolean;
};
type SingleOperator = {
    value: ExpressionType;
    operator: string;
    location: 'prefix' | 'postfix';
};
type InstanceOf = {
    value: ExpressionType;
    operator: string;
    type: TypeType;
};
type Cond = {
    condition: ExpressionType;
    trueValue: ExpressionType;
    falseValue: ExpressionType;
};
type DoubleOperator = {
    left: ExpressionType;
    operator: string;
    right: ExpressionType;
};

export type ExpressionType =
    | Normal
    | Primary
    | Dot
    | Array
    | MethodCall
    | New
    | Cast
    | Sub
    | SingleOperator
    | InstanceOf
    | Cond
    | DoubleOperator
    | undefined;

export const makeExpressionType = (expression: Expression): ExpressionType => {
    if (expression && expression.expression) {
        if (expression.type === 'normal') {
            return expression.expression;
        }

        if (expression.type === 'primary') {
            return makePrimary(expression.expression);
        }

        if (expression.type === 'dot') {
            const left = expression.expression.left;
            const right = expression.expression.right;
            const operator = expression.expression.operator;

            if (left && right && operator) {
                if (typeof right === 'string') {
                    return {
                        object: makeExpressionType(left),
                        operator: operator,
                        property: right,
                    };
                } else {
                    const method = right.value!;
                    const param = right.param;
                    const params: ExpressionType[] = [];
                    if (param) {
                        param.forEach((p) => {
                            params.push(makeExpressionType(p));
                        });
                    }

                    return {
                        object: makeExpressionType(left),
                        operator: operator,
                        methodName: method,
                        param: params,
                    };
                }
            }
        }

        if (expression.type === 'array') {
            const array = expression.expression;
            if (array) {
                const elements: any[] = [];
                array.forEach((element) => {
                    elements.push(makeExpressionType(element));
                });
                return elements;
            }
        }

        if (expression.type === 'methodCall') {
            const methodName = expression.expression.value;
            const param = expression.expression.param;
            const reference = expression.expression.reference;

            if (methodName && reference) {
                const params: ExpressionType[] = [];
                if (param) {
                    param.forEach((p) => {
                        params.push(makeExpressionType(p));
                    });
                }

                return {
                    methodName: methodName,
                    param: params.length > 0 ? params : undefined,
                    isSuper: reference.toLowerCase() === 'super',
                    isThis: reference.toLowerCase() === 'this',
                };
            }
        }

        if (expression.type === 'new') {
            const creator = expression.expression;
            if (creator) {
                return makeCreatorType(creator);
            }
        }

        if (expression.type === 'cast') {
            const value = expression.expression.value;
            const valueType = expression.expression.valueType;

            if (value && valueType) {
                return {
                    variant: makeExpressionType(expression.expression.value),
                    toType: makeTypeType(valueType),
                };
            }
        }

        if (expression.type === 'sub') {
            return {
                value: makeExpressionType(expression.expression),
                parenthesized: true,
            };
        }

        if (
            expression.type === 'postOp' ||
            expression.type === 'preOp' ||
            expression.type === 'neg'
        ) {
            const value = expression.expression.value;
            const operator = expression.expression.operator;

            if (value && operator) {
                return {
                    variant: makeExpressionType(value),
                    operator: operator,
                    location: expression.type === 'postOp' ? 'postfix' : 'prefix',
                };
            }
        }

        if (expression.type === 'instanceOf') {
            const left = expression.expression.left;
            const right = expression.expression.right;
            const operator = expression.expression.operator;

            if (left && right && operator) {
                return {
                    variant: makeExpressionType(left),
                    operator: operator,
                    type: makeTypeType(right),
                };
            }
        }

        if (expression.type === 'cond') {
            const condition = expression.expression.condition;
            const trueExpr = expression.expression.trueValue;
            const falseExpr = expression.expression.falseValue;

            if (condition && trueExpr && falseExpr) {
                return {
                    condition: makeExpressionType(condition),
                    trueExpr: makeExpressionType(trueExpr),
                    falseExpr: makeExpressionType(falseExpr),
                };
            }
        }

        if (
            expression.type === 'arth1' ||
            expression.type === 'arth2' ||
            expression.type === 'bit' ||
            expression.type === 'cmp' ||
            expression.type === 'equality' ||
            expression.type === 'bitAnd' ||
            expression.type === 'bitNot' ||
            expression.type === 'bitOr' ||
            expression.type === 'logAnd' ||
            expression.type === 'logOr' ||
            expression.type === 'coal' ||
            expression.type === 'assign'
        ) {
            const left = makeExpressionType(expression.expression.left);
            const right = makeExpressionType(expression.expression.right);
            const operator = expression.expression.operator;

            if (left && right && operator) {
                return {
                    left: left,
                    operator: operator,
                    right: right,
                };
            }
        }

        return undefined;
    }
};
