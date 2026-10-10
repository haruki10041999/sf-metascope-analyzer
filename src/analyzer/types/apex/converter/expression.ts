import {
    ErrorTypeClass,
    NormalExpressionTypeClass,
    PrimaryExpressionTypeClass,
    DotExpressionTypeClass,
    ArrayExpressionTypeClass,
    MethodCallExpressionTypeClass,
    NewExpressionTypeClass,
    CastExpressionTypeClass,
    SubExpressionTypeClass,
    PostOpExpressionTypeClass,
    PreOpExpressionTypeClass,
    NegExpressionTypeClass,
    Arth1ExpressionTypeClass,
    Arth2ExpressionTypeClass,
    BitExpressionTypeClass,
    CmpExpressionTypeClass,
    InstanceOfExpressionTypeClass,
    EqualityExpressionTypeClass,
    BitAndExpressionTypeClass,
    BitNotExpressionTypeClass,
    BitOrExpressionTypeClass,
    LogAndExpressionTypeClass,
    LogOrExpressionTypeClass,
    CoalExpressionTypeClass,
    CondExpressionTypeClass,
    AssignExpressionTypeClass,
    ParExpressionTypeClass,
    BoundExpressionTypeClass,
    FilteringExpressionTypeClass,
    FieldExpressionTypeClass,
    ConditionalExpressionTypeClass,
    LogicalExpressionTypeClass,
    WhereFieldExpressionTypeClass,
    WhereConditionalExpressionTypeClass,
    WhereLogicalExpressionTypeClass,
    isNormalExpressionType,
    isPrimaryExpressionType,
    isDotExpressionType,
    isArrayExpressionType,
    isMethodCallExpressionType,
    isNewExpressionType,
    isCastExpressionType,
    isSubExpressionType,
    isPostOpExpressionType,
    isPreOpExpressionType,
    isNegExpressionType,
    isArth1ExpressionType,
    isArth2ExpressionType,
    isBitExpressionType,
    isCmpExpressionType,
    isInstanceOfExpressionType,
    isEqualityExpressionType,
    isBitAndExpressionType,
    isBitNotExpressionType,
    isBitOrExpressionType,
    isLogAndExpressionType,
    isLogOrExpressionType,
    isCoalExpressionType,
    isCondExpressionType,
    isAssignExpressionType,
    isFieldExpressionType,
    isConditionalExpressionType,
    isLogicalExpressionType,
    isWhereFieldExpressionType,
    isWhereConditionalExpressionType,
    isWhereLogicalExpressionType,
    isPrimaryTypeAll,
    ExpressionAllTypeClass,
    isExpressionTypeAll,
    AnyIdTypeClass,
    DotMethodCallTypeClass,
    SoqlFunctionTypeClass,
    FieldNameTypeClass,
    isAnyIdType,
    isDotMethodCallType,
    isMethodCallType,
    isCreatorType,
    isTypeRefType,
    isDataCategorySelectionType,
    isSoqlFunctionType,
    isComparisonOperatorType,
    isNormalValueType,
    isFieldNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { anyIdConvert } from './id';
import { Primary, primaryConvert } from './primary';
import { fieldNameConvert } from './name';
import { MethodCall, methodCallConvert, DotMethodCall, dotMethodCallConvert } from './call';
import { TypeRef, typeRefConvert } from './type';
import { Creator, creatorConvert } from './rest';
import { DataCategorySelection, dataCategorySelectionConvert } from './clause';
import { NormalValue, normalValueConvert } from './value';
import { comparisonOperatorConvert, SoqlFunction, soqlFunctionConvert } from './query';

export const normalExpressionConvert = (
    target: NormalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const primaryExpressionConvert = (
    target: PrimaryExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Primary | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isPrimaryTypeAll, errorClass);
    if (valueTypeClass) {
        return primaryConvert(valueTypeClass, errorClass);
    }
    return undefined;
};

export type DotExpression = {
    left?: Expression;
    operator?: string;
    right?: string | DotMethodCall;
};

export const dotExpressionConvert = (
    target: DotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): DotExpression => {
    const dotExpression: DotExpression = {};
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            dotExpression.left = expression;
        }
    }
    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        dotExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(
        target.getRight(),
        (target): target is AnyIdTypeClass | DotMethodCallTypeClass =>
            isAnyIdType(target) || isDotMethodCallType(target),
        errorClass,
    );

    if (rightTypeClass) {
        if (isAnyIdType(rightTypeClass)) {
            dotExpression.right = anyIdConvert(rightTypeClass);
        }
        if (isDotMethodCallType(rightTypeClass)) {
            dotExpression.right = dotMethodCallConvert(rightTypeClass, errorClass);
        }
    }

    return dotExpression;
};

export const arrayExpressionConvert = (
    target: ArrayExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            const expression = expressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });
    return values;
};

export const methodCallExpressionConvert = (
    target: MethodCallExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCall => {
    const methodCallExpression: MethodCall = {
        param: [],
    };
    const valueTypeClass = toTypeClass(target.getValue(), isMethodCallType, errorClass);
    if (valueTypeClass) {
        const methodCall = methodCallConvert(valueTypeClass, errorClass);

        methodCallExpression.param.push(...methodCall.param);
        if (methodCall.value) {
            methodCallExpression.value = methodCall.value;
        }
        if (methodCall.reference) {
            methodCallExpression.reference = methodCall.reference;
        }
    }
    return methodCallExpression;
};

export const newExpressionConvert = (
    target: NewExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Creator | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isCreatorType, errorClass);
    if (valueTypeClass) {
        return creatorConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export type CastExpression = {
    value?: Expression;
    valueType: TypeRef;
};

export const castExpressionConvert = (
    target: CastExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CastExpression => {
    const castExpression: CastExpression = {
        valueType: {
            value: [],
        },
    };

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            castExpression.value = expression;
        }
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        const typeRef = typeRefConvert(valueTypeTypeClass, errorClass);
        castExpression.valueType.value.push(...typeRef.value);

        if (typeRef.dimension) {
            castExpression.valueType.dimension = typeRef.dimension;
        }
    }

    return castExpression;
};

export const subExpressionConvert = (
    target: SubExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        return expressionConvert(valueTypeClass, errorClass);
    }
    return undefined;
};

export type SingleOperatorExpression = {
    value?: Expression;
    operator: string;
    location: 'prefix' | 'postfix';
};

export const postOpExpressionConvert = (
    target: PostOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SingleOperatorExpression => {
    const postOpExpression: SingleOperatorExpression = {
        operator: target.getOperator(),
        location: 'postfix',
    };
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            postOpExpression.value = expression;
        }
    }

    return postOpExpression;
};

export const preOpExpressionConvert = (
    target: PreOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SingleOperatorExpression => {
    const preOpExpression: SingleOperatorExpression = {
        operator: target.getOperator(),
        location: 'prefix',
    };
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            preOpExpression.value = expression;
        }
    }

    return preOpExpression;
};

export const negExpressionConvert = (
    target: NegExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SingleOperatorExpression => {
    const negExpression: SingleOperatorExpression = {
        operator: target.getOperator(),
        location: 'prefix',
    };
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            negExpression.value = expression;
        }
    }

    return negExpression;
};

export type ExpToExpOperatorClass = {
    left?: Expression;
    operator?: string;
    right?: Expression;
};

export const arth1ExpressionConvert = (
    target: Arth1ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const arth1Expression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            arth1Expression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        arth1Expression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            arth1Expression.right = expression;
        }
    }

    return arth1Expression;
};

export const arth2ExpressionConvert = (
    target: Arth2ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const arth2Expression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            arth2Expression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        arth2Expression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            arth2Expression.right = expression;
        }
    }

    return arth2Expression;
};

export const bitExpressionConvert = (
    target: BitExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const bitExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            bitExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        bitExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            bitExpression.right = expression;
        }
    }

    return bitExpression;
};

export const cmpExpressionConvert = (
    target: CmpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const cmpExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            cmpExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        cmpExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            cmpExpression.right = expression;
        }
    }

    return cmpExpression;
};

export type InstanceOfExpression = {
    left?: Expression;
    operator?: string;
    right: TypeRef;
};

export const instanceOfExpressionConvert = (
    target: InstanceOfExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): InstanceOfExpression => {
    const instanceOfExpression: InstanceOfExpression = {
        right: {
            value: [],
        },
    };

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            instanceOfExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        instanceOfExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isTypeRefType, errorClass);
    if (rightTypeClass) {
        const typeRef = typeRefConvert(rightTypeClass, errorClass);

        instanceOfExpression.right.value.push(...typeRef.value);
        if (typeRef.dimension) {
            instanceOfExpression.right.dimension = typeRef.dimension;
        }
    }

    return instanceOfExpression;
};

export const equalityExpressionConvert = (
    target: EqualityExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const equalityExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            equalityExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        equalityExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            equalityExpression.right = expression;
        }
    }

    return equalityExpression;
};

export const bitAndExpressionConvert = (
    target: BitAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const bitAndExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            bitAndExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        bitAndExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            bitAndExpression.right = expression;
        }
    }

    return bitAndExpression;
};

export const bitNotExpressionConvert = (
    target: BitNotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const bitNotExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            bitNotExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        bitNotExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            bitNotExpression.right = expression;
        }
    }

    return bitNotExpression;
};

export const bitOrExpressionConvert = (
    target: BitOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const bitOrExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            bitOrExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        bitOrExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            bitOrExpression.right = expression;
        }
    }

    return bitOrExpression;
};

export const logAndExpressionConvert = (
    target: LogAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const logAndExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            logAndExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        logAndExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            logAndExpression.right = expression;
        }
    }

    return logAndExpression;
};

export const logOrExpressionConvert = (
    target: LogOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const logOrExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            logOrExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        logOrExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            logOrExpression.right = expression;
        }
    }

    return logOrExpression;
};

export const coalExpressionConvert = (
    target: CoalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const coalExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            coalExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        coalExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            coalExpression.right = expression;
        }
    }

    return coalExpression;
};

export type CondExpression = {
    condition?: Expression;
    true?: Expression;
    false?: Expression;
};

export const condExpressionConvert = (
    target: CondExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CondExpression => {
    const condExpression: CondExpression = {};

    const conditionTypeClass = toTypeClass(target.getCondition(), isExpressionTypeAll, errorClass);
    if (conditionTypeClass) {
        const expression = expressionConvert(conditionTypeClass, errorClass);
        if (expression) {
            condExpression.condition = expression;
        }
    }

    const trueTypeClass = toTypeClass(target.getTrueValue(), isExpressionTypeAll, errorClass);
    if (trueTypeClass) {
        const expression = expressionConvert(trueTypeClass, errorClass);
        if (expression) {
            condExpression.true = expression;
        }
    }

    const falseTypeClass = toTypeClass(target.getFalseValue(), isExpressionTypeAll, errorClass);
    if (falseTypeClass) {
        const expression = expressionConvert(falseTypeClass, errorClass);
        if (expression) {
            condExpression.false = expression;
        }
    }

    return condExpression;
};

export const assignExpressionConvert = (
    target: AssignExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorClass => {
    const assignExpression: ExpToExpOperatorClass = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            assignExpression.left = expression;
        }
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        assignExpression.operator = operator;
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            assignExpression.right = expression;
        }
    }

    return assignExpression;
};

export const parExpressionConvert = (
    target: ParExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        return expressionConvert(valueTypeClass, errorClass);
    }
    return undefined;
};

export const boundExpressionConvert = (
    target: BoundExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        return expressionConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export const filteringExpressionConvert = (
    target: FilteringExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategorySelection[] => {
    const values: DataCategorySelection[] = [];
    target.getValue().forEach((value) => {
        const valueTypeClass = toTypeClass(value, isDataCategorySelectionType, errorClass);
        if (valueTypeClass) {
            values.push(dataCategorySelectionConvert(valueTypeClass, errorClass));
        }
    });

    return values;
};

export type FieldExpression = {
    left?: string[] | SoqlFunction;
    operator?: string;
    right?: NormalValue;
};

export const fieldExpressionConvert = (
    target: FieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): FieldExpression => {
    const fieldExpression: FieldExpression = {};

    const leftTypeClass = toTypeClass(
        target.getLeft(),
        (target): target is FieldNameTypeClass | SoqlFunctionTypeClass =>
            isFieldNameType(target) || isSoqlFunctionType(target),
        errorClass,
    );
    if (leftTypeClass) {
        if (isFieldNameType(leftTypeClass)) {
            fieldExpression.left = fieldNameConvert(leftTypeClass, errorClass);
        }
        if (isSoqlFunctionType(leftTypeClass)) {
            fieldExpression.left = soqlFunctionConvert(leftTypeClass, errorClass);
        }
    }

    const operatorTypeClass = toTypeClass(
        target.getOperator(),
        isComparisonOperatorType,
        errorClass,
    );
    if (operatorTypeClass) {
        const operator = comparisonOperatorConvert(operatorTypeClass, errorClass);
        if (operator) {
            fieldExpression.operator = operator;
        }
    }

    const rightTypeClass = toTypeClass(target.getRight(), isNormalValueType, errorClass);
    if (rightTypeClass) {
        fieldExpression.right = normalValueConvert(rightTypeClass, errorClass);
    }

    return fieldExpression;
};

export const conditionalExpressionConvert = (
    target: ConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogicalExpression | FieldExpression | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is LogicalExpressionTypeClass | FieldExpressionTypeClass =>
            isLogicalExpressionType(target) || isFieldExpressionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isLogicalExpressionType(valueTypeClass)) {
            return logicalExpressionConvert(valueTypeClass, errorClass);
        }
        if (isFieldExpressionType(valueTypeClass)) {
            return fieldExpressionConvert(valueTypeClass, errorClass);
        }
    }

    return undefined;
};

export type LogicalExpression = {
    value: (LogicalExpression | FieldExpression)[];
    operator?: string;
};

export const logicalExpressionConvert = (
    target: LogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogicalExpression => {
    const values: (LogicalExpression | FieldExpression)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            const expression = conditionalExpressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });

    const logicalExpression: LogicalExpression = {
        value: values,
    };

    const operator = target.getOperator();
    if (operator) {
        logicalExpression.operator = operator;
    }

    return logicalExpression;
};

export type WhereFieldExpression = {
    left?: string | FieldExpression;
    operator?: string;
    right?: NormalValue;
};

export const whereFieldExpressionConvert = (
    target: WhereFieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereFieldExpression => {
    const whereFieldExpression: WhereFieldExpression = {};

    const leftTypeClass = target.getLeft();
    if (typeof leftTypeClass === 'string') {
        whereFieldExpression.left = leftTypeClass;
    } else {
        const fieldTypeClass = toTypeClass(leftTypeClass, isFieldExpressionType, errorClass);
        if (fieldTypeClass) {
            const expression = fieldExpressionConvert(fieldTypeClass, errorClass);
            if (expression) {
                whereFieldExpression.left = expression;
            }
        }
    }

    const operatorValue = target.getOperator();
    if (operatorValue) {
        const typeClass = toTypeClass(operatorValue, isComparisonOperatorType, errorClass);
        if (typeClass) {
            const operator = comparisonOperatorConvert(typeClass, errorClass);
            if (operator) {
                whereFieldExpression.operator = operator;
            }
        }
    }

    const rightValue = target.getRight();
    if (rightValue) {
        const typeClass = toTypeClass(rightValue, isNormalValueType, errorClass);
        if (typeClass) {
            const value = normalValueConvert(typeClass, errorClass);
            if (value) {
                whereFieldExpression.right = value;
            }
        }
    }

    return whereFieldExpression;
};

export const whereConditionalExpressionConvert = (
    target: WhereConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpression | WhereFieldExpression | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass =>
            isWhereLogicalExpressionType(target) || isWhereFieldExpressionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isWhereLogicalExpressionType(valueTypeClass)) {
            return whereLogicalExpressionConvert(valueTypeClass, errorClass);
        }
        if (isWhereFieldExpressionType(valueTypeClass)) {
            return whereFieldExpressionConvert(valueTypeClass, errorClass);
        }
    }

    return undefined;
};

export type WhereLogicalExpression = {
    value: (WhereLogicalExpression | WhereFieldExpression)[];
    operator?: string;
};

export const whereLogicalExpressionConvert = (
    target: WhereLogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpression => {
    const values: (WhereLogicalExpression | WhereFieldExpression)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isWhereConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            const expression = whereConditionalExpressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });

    const whereLogicalExpression: WhereLogicalExpression = {
        value: values,
    };

    const operator = target.getOperator();
    if (operator) {
        whereLogicalExpression.operator = operator;
    }
    return whereLogicalExpression;
};

export type Expression =
    | {
          type: 'normal';
          expression?: string;
      }
    | {
          type: 'primary';
          expression?: Primary;
      }
    | {
          type: 'dot';
          expression?: DotExpression;
      }
    | {
          type: 'array';
          expression: Expression[];
      }
    | {
          type: 'methodCall';
          expression: MethodCall;
      }
    | {
          type: 'new';
          expression?: Creator;
      }
    | {
          type: 'cast';
          expression?: CastExpression;
      }
    | {
          type: 'sub';
          expression?: Expression;
      }
    | {
          type: 'postOp' | 'preOp' | 'neg';
          expression?: SingleOperatorExpression;
      }
    | {
          type:
              | 'arth1'
              | 'arth2'
              | 'bit'
              | 'cmp'
              | 'equality'
              | 'bitAnd'
              | 'bitOr'
              | 'bitNot'
              | 'assign'
              | 'cmp'
              | 'logAnd'
              | 'logOr'
              | 'coal';
          expression?: ExpToExpOperatorClass;
      }
    | {
          type: 'instanceOf';
          expression?: InstanceOfExpression;
      }
    | {
          type: 'cond';
          expression?: CondExpression;
      };

export const expressionConvert = (
    target: ExpressionAllTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    let expression: Expression | undefined = undefined;

    if (isNormalExpressionType(target)) {
        expression = { type: 'normal' };
        const value = normalExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isPrimaryExpressionType(target)) {
        expression = { type: 'primary' };
        const value = primaryExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isDotExpressionType(target)) {
        expression = { type: 'dot' };
        const value = dotExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isArrayExpressionType(target)) {
        expression = { type: 'array', expression: [] };
        expression.expression.push(...arrayExpressionConvert(target, errorClass));
    }
    if (isMethodCallExpressionType(target)) {
        const value = methodCallExpressionConvert(target, errorClass);
        expression = {
            type: 'methodCall',
            expression: value,
        };
    }
    if (isNewExpressionType(target)) {
        expression = { type: 'new' };
        const value = newExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isCastExpressionType(target)) {
        expression = { type: 'cast' };
        const value = castExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isSubExpressionType(target)) {
        expression = { type: 'sub' };
        const value = subExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isPostOpExpressionType(target)) {
        expression = { type: 'postOp' };
        const value = postOpExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isPreOpExpressionType(target)) {
        expression = { type: 'preOp' };
        const value = preOpExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isNegExpressionType(target)) {
        expression = { type: 'neg' };
        const value = negExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isArth1ExpressionType(target)) {
        expression = { type: 'arth1' };
        const value = arth1ExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isArth2ExpressionType(target)) {
        expression = { type: 'arth2' };
        const value = arth2ExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isBitExpressionType(target)) {
        expression = { type: 'bit' };
        const value = bitExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isBitAndExpressionType(target)) {
        expression = { type: 'bitAnd' };
        const value = bitAndExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isBitOrExpressionType(target)) {
        expression = { type: 'bitOr' };
        const value = bitOrExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isBitNotExpressionType(target)) {
        expression = { type: 'bitNot' };
        const value = bitNotExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isAssignExpressionType(target)) {
        expression = { type: 'assign' };
        const value = assignExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isCmpExpressionType(target)) {
        expression = { type: 'cmp' };
        const value = cmpExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isInstanceOfExpressionType(target)) {
        expression = { type: 'instanceOf' };
        const value = instanceOfExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isEqualityExpressionType(target)) {
        expression = { type: 'equality' };
        const value = equalityExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isLogAndExpressionType(target)) {
        expression = { type: 'logAnd' };
        const value = logAndExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isLogOrExpressionType(target)) {
        expression = { type: 'logOr' };
        const value = logOrExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isCoalExpressionType(target)) {
        expression = { type: 'coal' };
        const value = coalExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }
    if (isCondExpressionType(target)) {
        expression = { type: 'cond' };
        const value = condExpressionConvert(target, errorClass);
        if (value) {
            expression.expression = value;
        }
    }

    return expression;
};
