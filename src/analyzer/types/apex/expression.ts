import {
    ExpressionClass,
    isNormalExpressionElementClass,
    isPrimaryExpressionElementClass,
    isDotExpressionElementClass,
    isMethodCallExpressionElementClass,
    isArrayExpressionElementClass,
    isNewExpressionElementClass,
    isCastExpressionElementClass,
    isArrayRestElementClass,
    isExpressionArrayRestElementClass,
    isMapRestElementClass,
    isNoRestElementClass,
    isSubExpressionElementClass,
    isSingleOperatorExpressionElementClass,
    isExpToExpOperatorExpressionElementClass,
    isInstanceOfExpressionElementClass,
    isCondExpressionElementClass,
    isString,
    isDotMethodCallClass,
} from './converter';

import { PrimaryType, makePrimaryType } from './primary';
import { TypeType, makeTypeType } from './type';

type DotExpressionType = {
    object: ExpressionType;
    dot: string;
} & (
    | {
          kind: 'field';
          name: string;
      }
    | {
          kind: 'method';
          name: string;
          arg?: ExpressionType[];
      }
);

type MethodCallType = {
    kind: 'method';
    name?: string;
    arg?: ExpressionType[];
    isSuper: boolean;
    isThis: boolean;
};

type CreatedNameType = {
    typeName: string[];
    generic?: TypeType[];
};

type ArrayCreatorRestType = CreatedNameType & {
    creatorType: 'array';
    size?: ExpressionType;
    initValue: ExpressionType[];
};

type ClassCreatorRestType = CreatedNameType & {
    creatorType: 'class';
    arg?: ExpressionType[];
};

type MapCreatorRestType = CreatedNameType & {
    creatorType: 'map';
    initValue?: {
        key: ExpressionType;
        value: ExpressionType;
    }[];
};

type SetCreatorRestType = CreatedNameType & {
    creatorType: 'set';
    initialValue: ExpressionType[];
};

type CreatorType = {
    kind: 'instance';
} & (
    | CreatedNameType
    | ArrayCreatorRestType
    | ClassCreatorRestType
    | MapCreatorRestType
    | SetCreatorRestType
);

type CastType = {
    kind: 'cast';
    value: ExpressionType;
    convertTo: TypeType;
};

type SubType = {
    kind: 'sub';
    value: ExpressionType;
    parenthesized: true;
};

type ArrayAccessType = {
    kind: 'arrayAccess';
    object: ExpressionType;
    index: ExpressionType[];
};

type SingleOperatorType = {
    kind: 'prefix' | 'postfix';
    value: ExpressionType;
    operator: string;
};

type DoubleOperatorType = {
    kind: 'expression';
    left: ExpressionType;
    operator: string;
    right: ExpressionType;
};

type InstanceOfType = {
    kind: 'expression';
    left: ExpressionType;
    operator: string;
    right: TypeType;
};

type CondType = {
    kind: 'ternary';
    condition: ExpressionType;
    trueValue: ExpressionType;
    falseValue: ExpressionType;
};

export type ExpressionType =
    | string
    | PrimaryType
    | ArrayAccessType
    | DotExpressionType
    | MethodCallType
    | CreatorType
    | CastType
    | SubType
    | SingleOperatorType
    | DoubleOperatorType
    | InstanceOfType
    | CondType;

export const makeExpressionType = (expression: ExpressionClass): ExpressionType | undefined => {
    const elementClass = expression.getValue();

    if (elementClass) {
        if (isNormalExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                return value;
            }
        }

        if (isPrimaryExpressionElementClass(elementClass)) {
            return makePrimaryType(elementClass.getExpression());
        }

        if (isDotExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                const left = value.getLeft();
                const operator = value.getOperator();
                const right = value.getRight();

                if (left && operator && right) {
                    const object = makeExpressionType(left);
                    if (object) {
                        if (isString(right)) {
                            return {
                                kind: 'field',
                                object: object,
                                dot: operator,
                                name: right,
                            };
                        }

                        if (isDotMethodCallClass(right)) {
                            const name = right.getValue();
                            const param = right.getParam();

                            if (name) {
                                const expressionType: DotExpressionType = {
                                    kind: 'method',
                                    object: object,
                                    dot: operator,
                                    name: name,
                                };

                                if (param.length > 0) {
                                    expressionType.arg = param
                                        .map((p) => makeExpressionType(p))
                                        .filter((p) => p !== undefined);
                                }
                                return expressionType;
                            }
                        }
                    }
                }
            }
        }

        if (isArrayExpressionElementClass(elementClass)) {
            const values = elementClass
                .getExpression()
                .map((v) => makeExpressionType(v))
                .filter((v) => v !== undefined);
            const object = values[0];
            if (object && values.length > 1) {
                return {
                    kind: 'arrayAccess',
                    object: object,
                    index: values.slice(1),
                };
            }
        }

        if (isMethodCallExpressionElementClass(elementClass)) {
            const expression = elementClass.getExpression();

            if (expression) {
                const name = expression.getValue();
                const arg = expression.getParam();
                const reference = expression.getReference();

                if (name || reference) {
                    const expressionType: MethodCallType = {
                        kind: 'method',
                        isSuper: Boolean(reference && reference.toLowerCase() === 'super'),
                        isThis: Boolean(reference && reference.toLowerCase() === 'this'),
                    };

                    if (name) {
                        expressionType.name = name;
                    }

                    if (arg.length > 0) {
                        expressionType.arg = arg
                            .map((a) => makeExpressionType(a))
                            .filter((a) => a !== undefined);
                    }

                    return expressionType;
                }
            }
        }

        if (isNewExpressionElementClass(elementClass)) {
            const restElementClass = elementClass.getExpression().getValue();

            if (restElementClass) {
                const idCreatedNamePairs = restElementClass.getValue();

                const createdName: CreatedNameType = {
                    typeName: [],
                };
                idCreatedNamePairs.forEach((i) => {
                    const left = i.getLeft();

                    if (left) {
                        createdName.typeName.push(left);
                    }
                });

                if (idCreatedNamePairs.at(-1) && idCreatedNamePairs.at(-1)!.getRight().length > 0) {
                    createdName.generic = idCreatedNamePairs
                        .at(-1)!
                        .getRight()
                        .map((r) => makeTypeType(r))
                        .filter((r) => r !== undefined);
                }

                if (isArrayRestElementClass(restElementClass)) {
                    const content = restElementClass.getContent();
                    const size = makeExpressionType(content.getSize());
                    const initialValue = content
                        .getValue()
                        .map((a) => makeExpressionType(a))
                        .filter((a) => a !== undefined);

                    const expressionType: ArrayCreatorRestType = {
                        ...createdName,
                        creatorType: 'array',
                        initValue: initialValue,
                    };

                    if (size) {
                        expressionType.size = size;
                    }

                    return {
                        kind: 'instance',
                        ...expressionType,
                    };
                }

                if (isExpressionArrayRestElementClass(restElementClass)) {
                    if (restElementClass.getType() === 'class') {
                        const expressionType: ClassCreatorRestType = {
                            ...createdName,
                            creatorType: 'class',
                        };

                        if (restElementClass.getContent().length > 0) {
                            expressionType.arg = restElementClass
                                .getContent()
                                .map((a) => makeExpressionType(a))
                                .filter((a) => a !== undefined);
                        }

                        return {
                            kind: 'instance',
                            ...expressionType,
                        };
                    }

                    if (restElementClass.getType() === 'set') {
                        const expressionType: SetCreatorRestType = {
                            ...createdName,
                            creatorType: 'set',
                            initialValue: [],
                        };

                        expressionType.initialValue = restElementClass
                            .getContent()
                            .map((a) => makeExpressionType(a))
                            .filter((a) => a !== undefined);

                        return {
                            kind: 'instance',
                            ...expressionType,
                        };
                    }
                }

                if (isMapRestElementClass(restElementClass)) {
                    const content = restElementClass.getContent();

                    const expressionType: MapCreatorRestType = {
                        ...createdName,
                        creatorType: 'map',
                    };

                    if (content.length > 0) {
                        const initialValue: {
                            key: ExpressionType;
                            value: ExpressionType;
                        }[] = [];
                        content.forEach((item) => {
                            const left = makeExpressionType(item.getLeft());
                            const right = makeExpressionType(item.getRight());
                            if (left && right) {
                                initialValue.push({
                                    key: left,
                                    value: right,
                                });
                            }
                        });
                        expressionType.initValue = initialValue;
                    }

                    return {
                        kind: 'instance',
                        ...expressionType,
                    };
                }
                if (isNoRestElementClass(restElementClass)) {
                    if (restElementClass.getContent() === '{}') {
                        return {
                            kind: 'instance',
                            ...createdName,
                            creatorType: 'set',
                            initialValue: [],
                        };
                    }

                    return {
                        kind: 'instance',
                        ...createdName,
                        creatorType: 'class',
                    };
                }
            }
        }

        if (isCastExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const valueValue = makeExpressionType(value.getValue());
            const valueType = makeTypeType(value.getValueType());

            if (valueValue && valueType) {
                return {
                    kind: 'cast',
                    value: valueValue,
                    convertTo: valueType,
                };
            }
        }

        if (isSubExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                const expression = makeExpressionType(value);
                if (expression) {
                    return {
                        kind: 'sub',
                        value: expression,
                        parenthesized: true,
                    };
                }
            }
        }

        if (isSingleOperatorExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const valueValue = makeExpressionType(value.getValue());
            const operator = value.getOperator();
            const location = value.getLocation();

            if (valueValue && operator && location) {
                return {
                    kind: location,
                    value: valueValue,
                    operator: operator,
                };
            }
        }

        if (isExpToExpOperatorExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const left = makeExpressionType(value.getLeft());
            const operator = value.getOperator();
            const right = makeExpressionType(value.getRight());

            if (left && operator && right) {
                return {
                    kind: 'expression',
                    left: left,
                    operator: operator,
                    right: right,
                };
            }
        }

        if (isInstanceOfExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const left = makeExpressionType(value.getLeft());
            const operator = value.getOperator();
            const right = makeTypeType(value.getRight());

            if (left && operator && right) {
                return {
                    kind: 'expression',
                    left: left,
                    operator: operator,
                    right: right,
                };
            }
        }

        if (isCondExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const condition = makeExpressionType(value.getCondition());
            const trueValue = makeExpressionType(value.getTrueValue());
            const falseValue = makeExpressionType(value.getFalseValue());

            if (condition && trueValue && falseValue) {
                return {
                    kind: 'ternary',
                    condition: condition,
                    trueValue: trueValue,
                    falseValue: falseValue,
                };
            }
        }
    }

    return undefined;
};
