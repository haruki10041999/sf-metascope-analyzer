import {
    ExpressionClass,
    NormalExpressionElementClass,
    PrimaryExpressionElementClass,
    DotExpressionElementClass,
    MethodCallExpressionElementClass,
    ArrayExpressionElementClass,
    NewExpressionElementClass,
    CastExpressionElementClass,
    SubExpressionElementClass,
    SingleOperatorExpressionElementClass,
    ExpToExpOperatorExpressionElementClass,
    InstanceOfExpressionElementClass,
    CondExpressionElementClass,
    PrimaryClass,
    DotExpressionClass,
    MethodCallClass,
    CreatorClass,
    IdCreatedNamePairClass,
    ArrayCreatorRestClass,
    MapCreatorRestPairClass,
    CastExpressionClass,
    SingleOperatorExpressionClass,
    ExpToExpOperatorExpressionClass,
    InstanceOfExpressionClass,
    CondExpressionClass,
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
    left: ExpressionType;
    operator: string;
    right: TypeType;
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

export const makeExpressionType = (expression: ExpressionClass): ExpressionType => {
    const elementClass = expression.getValue();

    if (elementClass) {
        if (isNormalExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                return value;
            }
        }

        if (isPrimaryExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                return makePrimaryType(value);
            }
        }

        if (isDotExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                const left = value.getLeft();
                const operator = value.getOperator();
                const right = value.getRight();

                if (!left || !operator || !right) {
                    return 'unSupported';
                }

                const object = makeExpressionType(left);
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

                    if (!name) {
                        return 'unSupported';
                    }

                    const expressionType: DotExpressionType = {
                        kind: 'method',
                        object: object,
                        dot: operator,
                        name: name,
                    };

                    if (param.length > 0) {
                        expressionType.arg = param.map((a) => makeExpressionType(a));
                    }
                    return expressionType;
                }
            }
        }

        if (isArrayExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                return value.map((v) => makeExpressionType(v));
            }
        }

        if (isMethodCallExpressionElementClass(elementClass)) {
            const expression = elementClass.getExpression();

            if (expression) {
                const name = expression.getValue();
                const arg = expression.getParam();
                const reference = expression.getReference();

                if (!name && !reference) {
                    return 'unSupported';
                }

                const expressionType: MethodCallType = {
                    kind: 'method',
                    isSuper: Boolean(reference && reference.toLowerCase() === 'super'),
                    isThis: Boolean(reference && reference.toLowerCase() === 'this'),
                };

                if (name) {
                    expressionType.name = name;
                }

                if (arg.length > 0) {
                    expressionType.arg = arg.map((a) => makeExpressionType(a));
                }
                return expressionType;
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
                        .map((r) => makeTypeType(r));
                }

                if (isArrayRestElementClass(restElementClass)) {
                    const content = restElementClass.getContent();
                    const size = content.getSize();
                    const initialValue = content.getValue();

                    const expressionType: ArrayCreatorRestType = {
                        ...createdName,
                    };

                    if (size) {
                        expressionType.size = makeExpressionType(size);
                    }

                    if (initialValue.length > 0) {
                        expressionType.initValue = initialValue.map((i) => makeExpressionType(i));
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
                        };

                        if (restElementClass.getContent().length > 0) {
                            expressionType.arg = restElementClass
                                .getContent()
                                .map((a) => makeExpressionType(a));
                        }

                        return {
                            kind: 'instance',
                            ...expressionType,
                        };
                    }

                    if (restElementClass.getType() === 'set') {
                        const expressionType: SetCreatorRestType = {
                            ...createdName,
                        };

                        if (restElementClass.getContent().length > 0) {
                            expressionType.initialValue = restElementClass
                                .getContent()
                                .map((a) => makeExpressionType(a));
                        }

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
                    };

                    if (content.length > 0) {
                        const initialValue: {
                            key: ExpressionType;
                            value: ExpressionType;
                        }[] = [];
                        content.forEach((item) => {
                            const left = item.getLeft();
                            const right = item.getRight();
                            if (left && right) {
                                initialValue.push({
                                    key: makeExpressionType(left),
                                    value: makeExpressionType(right),
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
                    return {
                        kind: 'instance',
                        ...createdName,
                    };
                }
            }
        }

        if (isCastExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const valueValue = value.getValue();
            const valueType = value.getValueType();

            return {
                value: makeExpressionType(valueValue),
                convertTo: makeTypeType(valueType),
            };
        }

        if (isSubExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            if (value) {
                return {
                    value: makeExpressionType(value),
                    parenthesized: true,
                };
            }
        }

        if (isSingleOperatorExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const valueValue = value.getValue();
            const operator = value.getOperator();
            const location = value.getLocation();

            if (valueValue && operator && location) {
                return {
                    value: makeExpressionType(valueValue),
                    operator: operator,
                    location: location,
                };
            }
        }

        if (isExpToExpOperatorExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const left = value.getLeft();
            const operator = value.getOperator();
            const right = value.getRight();

            if (left && operator && right) {
                return {
                    left: makeExpressionType(left),
                    operator: operator,
                    right: makeExpressionType(right),
                };
            }
        }

        if (isInstanceOfExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const left = value.getLeft();
            const operator = value.getOperator();
            const right = value.getRight();

            if (left && operator && right) {
                return {
                    left: makeExpressionType(left),
                    operator: operator,
                    right: makeTypeType(right),
                };
            }
        }

        if (isCondExpressionElementClass(elementClass)) {
            const value = elementClass.getExpression();
            const condition = value.getCondition();
            const trueValue = value.getTrueValue();
            const falseValue = value.getFalseValue();

            if (condition && trueValue && falseValue) {
                return {
                    condition: makeExpressionType(condition),
                    truevalue: makeExpressionType(trueValue),
                    falseValue: makeExpressionType(falseValue),
                };
            }
        }
    }

    return 'unSupported';
};
