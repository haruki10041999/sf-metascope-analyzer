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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { anyIdConvert } from './id';
import { PrimaryClass, primaryConvert, PrimaryElementClass } from './primary';
import { fieldNameConvert } from './name';
import {
    MethodCallClass,
    DotMethodCallClass,
    methodCallConvert,
    dotMethodCallConvert,
} from './call';
import { TypeRefClass, typeRefConvert } from './type';
import { CreatorClass, creatorConvert } from './rest';
import { DataCategorySelectionClass, dataCategorySelectionConvert } from './clause';
import { NormalValueClass, normalValueConvert } from './value';
import { SoqlFunctionClass, comparisonOperatorConvert, soqlFunctionConvert } from './query';

export const normalExpressionConvert = (
    target: NormalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const primaryExpressionConvert = (
    target: PrimaryExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PrimaryClass | null => {
    const primaryClass = new PrimaryClass();

    const valueTypeClass = toTypeClass(target.getValue(), isPrimaryTypeAll, errorClass);
    if (valueTypeClass) {
        primaryClass.copy(primaryConvert(valueTypeClass, errorClass));
    }
    return primaryClass;
};

export class DotExpressionClass extends CommonClass {
    private left: ExpressionClass | null = null;
    private operator: string | null = null;
    private right: string | DotMethodCallClass | null = null;

    setLeft(left: ExpressionClass | null): void {
        this.left = left;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: string | DotMethodCallClass | null): void {
        this.right = right;
    }

    getLeft(): ExpressionClass | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): string | DotMethodCallClass | null {
        return this.right;
    }

    copy(commonClass: DotExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isDotExpressionClass = (target: CommonClass): target is DotExpressionClass => {
    return isCommonClass(target, DotExpressionClass);
};

export const dotExpressionConvert = (
    target: DotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): DotExpressionClass => {
    const dotExpression = new DotExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        dotExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (operator) {
        dotExpression.setOperator(operator);
    }

    const rightTypeClass = toTypeClass(
        target.getRight(),
        (target): target is AnyIdTypeClass | DotMethodCallTypeClass =>
            isAnyIdType(target) || isDotMethodCallType(target),
        errorClass,
    );

    if (rightTypeClass) {
        if (isAnyIdType(rightTypeClass)) {
            dotExpression.setRight(anyIdConvert(rightTypeClass));
        }
        if (isDotMethodCallType(rightTypeClass)) {
            dotExpression.setRight(dotMethodCallConvert(rightTypeClass, errorClass));
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
): CreatorClass => {
    const newExpression = new CreatorClass();

    const valueTypeClass = toTypeClass(target.getValue(), isCreatorType, errorClass);
    if (valueTypeClass) {
        newExpression.copy(creatorConvert(valueTypeClass, errorClass));
    }

    return newExpression;
};

export class CastExpressionClass extends CommonClass {
    private value: ExpressionClass = new ExpressionClass();
    private valueType: TypeRefClass = new TypeRefClass();

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    setValueType(valueType: TypeRefClass): void {
        this.valueType.copy(valueType);
    }

    getValue(): ExpressionClass {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    copy(commonClass: CastExpressionClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const castExpressionConvert = (
    target: CastExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CastExpressionClass => {
    const castExpression = new CastExpressionClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        castExpression.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        castExpression.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
    }

    return castExpression;
};

export const subExpressionConvert = (
    target: SubExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | null => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        return expressionConvert(valueTypeClass, errorClass);
    }
    return null;
};

export class SingleOperatorExpressionClass extends CommonClass {
    private value: ExpressionClass | null = null;
    private operator: string | null = null;
    private location: 'prefix' | 'postfix' | null = null;

    setValue(value: ExpressionClass | null): void {
        this.value = value;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setLocation(location: 'prefix' | 'postfix' | null): void {
        this.location = location;
    }

    getValue(): ExpressionClass | null {
        return this.value;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getLocation(): 'prefix' | 'postfix' | null {
        return this.location;
    }

    copy(commonClass: SingleOperatorExpressionClass): void {
        this.setValue(commonClass.getValue());
        this.setOperator(commonClass.getOperator());
        this.setLocation(commonClass.getLocation());
    }
}

export const isSingleOperatorExpressionClass = (
    target: CommonClass,
): target is SingleOperatorExpressionClass => {
    return isCommonClass(target, SingleOperatorExpressionClass);
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

export class ExpToExpOperatorExpressionClass extends CommonClass {
    private left: ExpressionClass | null = null;
    private operator: string | null = null;
    private right: ExpressionClass | null = null;

    setLeft(left: ExpressionClass | null): void {
        this.left = left;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: ExpressionClass | null): void {
        this.right = right;
    }

    getLeft(): ExpressionClass | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): ExpressionClass | null {
        return this.right;
    }

    copy(commonClass: ExpToExpOperatorExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isExpToExpOperatorExpressionClass = (
    target: CommonClass,
): target is ExpToExpOperatorExpressionClass => {
    return isCommonClass(target, ExpToExpOperatorExpressionClass);
};

export const arth1ExpressionConvert = (
    target: Arth1ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpression => {
    const arth1Expression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const arth2Expression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const bitExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const cmpExpression: ExpToExpOperatorExpression = {};

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

export class InstanceOfExpressionClass extends CommonClass {
    private left: ExpressionClass | null = null;
    private operator: string | null = null;
    private right: TypeRef | null = null;

    setLeft(left: ExpressionClass | null): void {
        this.left = left;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: TypeRef | null): void {
        this.right = right;
    }

    getLeft(): ExpressionClass | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): TypeRef | null {
        return this.right;
    }

    copy(commonClass: InstanceOfExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isInstanceOfExpressionClass = (
    target: CommonClass,
): target is InstanceOfExpressionClass => {
    return isCommonClass(target, InstanceOfExpressionClass);
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
): ExpToExpOperatorExpression => {
    const equalityExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const bitAndExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const bitNotExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const bitOrExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const logAndExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const logOrExpression: ExpToExpOperatorExpression = {};

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
): ExpToExpOperatorExpression => {
    const coalExpression: ExpToExpOperatorExpression = {};

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

export class CondExpressionClass extends CommonClass {
    private condition: ExpressionClass | null = null;
    private trueValue: ExpressionClass | null = null;
    private falseValue: ExpressionClass | null = null;

    setCondition(condition: ExpressionClass | null): void {
        this.condition = condition;
    }

    setTrueValue(trueValue: ExpressionClass | null): void {
        this.trueValue = trueValue;
    }

    setFalseValue(falseValue: ExpressionClass | null): void {
        this.falseValue = falseValue;
    }

    getCondition(): ExpressionClass | null {
        return this.condition;
    }

    getTrueValue(): ExpressionClass | null {
        return this.trueValue;
    }

    getFalseValue(): ExpressionClass | null {
        return this.falseValue;
    }

    copy(commonClass: CondExpressionClass): void {
        this.setCondition(commonClass.getCondition());
        this.setTrueValue(commonClass.getTrueValue());
        this.setFalseValue(commonClass.getFalseValue());
    }
}

export const isCondExpressionClass = (target: CommonClass): target is CondExpressionClass => {
    return isCommonClass(target, CondExpressionClass);
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
): ExpToExpOperatorExpression => {
    const assignExpression: ExpToExpOperatorExpression = {};

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
): ExpressionClass => {
    const expressionClass = new ExpressionClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        expressionClass.copy(expressionConvert(valueTypeClass, errorClass));
    }
    return expressionClass;
};

export const boundExpressionConvert = (
    target: BoundExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | null => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        return expressionConvert(valueTypeClass, errorClass);
    }

    return null;
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

export class FieldExpressionClass extends CommonClass {
    private left: string[] | SoqlFunction | null = null;
    private operator: string | null = null;
    private right: NormalValue | null = null;

    setLeft(left: string[] | SoqlFunction | null): void {
        this.left = left;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: NormalValue | null): void {
        this.right = right;
    }

    getLeft(): string[] | SoqlFunction | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): NormalValue | null {
        return this.right;
    }

    copy(commonClass: FieldExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isFieldExpressionClass = (target: CommonClass): target is FieldExpressionClass => {
    return isCommonClass(target, FieldExpressionClass);
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
): LogicalExpression | FieldExpression | null => {
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

    return null;
};

export class LogicalExpressionClass extends CommonClass {
    private value: (LogicalExpressionClass | FieldExpressionClass)[] = [];
    private operator: string | null = null;

    setValue(value: (LogicalExpressionClass | FieldExpressionClass)[]): void {
        this.value.push(...value);
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    getValue(): (LogicalExpressionClass | FieldExpressionClass)[] {
        return this.value;
    }

    getOperator(): string | null {
        return this.operator;
    }

    copy(commonClass: LogicalExpressionClass): void {
        this.setValue(commonClass.getValue());
        this.setOperator(commonClass.getOperator());
    }
}

export const isLogicalExpressionClass = (target: CommonClass): target is LogicalExpressionClass => {
    return isCommonClass(target, LogicalExpressionClass);
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

export class WhereFieldExpressionClass extends CommonClass {
    private left: string | FieldExpressionClass | null = null;
    private operator: string | null = null;
    private right: NormalValue | null = null;

    setLeft(left: string | FieldExpressionClass | null): void {
        this.left = left;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: NormalValue | null): void {
        this.right = right;
    }

    getLeft(): string | FieldExpressionClass | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): NormalValue | null {
        return this.right;
    }

    copy(commonClass: WhereFieldExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isWhereFieldExpressionClass = (
    target: CommonClass,
): target is WhereFieldExpression => {
    return isCommonClass(target, WhereFieldExpressionClass);
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
): WhereLogicalExpression | WhereFieldExpression | null => {
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

    return null;
};

export class WhereLogicalExpressionClass extends CommonClass {
    private value: (WhereLogicalExpressionClass | WhereFieldExpressionClass)[] = [];
    private operator: string | null = null;

    setValue(value: (WhereLogicalExpressionClass | WhereFieldExpressionClass)[]): void {
        this.value.push(...value);
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    getValue(): (WhereLogicalExpressionClass | WhereFieldExpressionClass)[] {
        return this.value;
    }

    getOperator(): string | null {
        return this.operator;
    }

    copy(commonClass: WhereLogicalExpressionClass): void {
        this.setValue(commonClass.getValue());
        this.setOperator(commonClass.getOperator());
    }
}

export const isWhereLogicalExpressionClass = (
    target: CommonClass,
): target is WhereLogicalExpressionClass => {
    return isCommonClass(target, WhereLogicalExpressionClass);
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

export abstract class ExpressionElementClass<TType, TExpression> extends CommonClass {
    private type: TType;
    private expression: TExpression;

    constructor(type: TType, expression: TExpression) {
        super();
        this.type = type;
        this.expression = expression;
    }

    getType(): TType {
        return this.type;
    }

    getExpression(): TExpression {
        return this.expression;
    }
}

export const isExpressionElementClass = (
    target: CommonClass,
): target is ExpressionElementClass<unknown, unknown> => {
    return isCommonClass(target, ExpressionElementClass);
};

export class NormalExpressionElementClass extends ExpressionElementClass<'normal', string | null> {
    constructor(expression: string | null) {
        super('normal', expression);
    }
}

export const isNormalExpressionElementClass = (
    target: CommonClass,
): target is NormalExpressionElementClass => {
    return isCommonClass(target, NormalExpressionElementClass);
};

export class PrimaryExpressionElementClass extends ExpressionElementClass<
    'primary',
    Primary | null
> {
    constructor(expression: Primary | null) {
        super('primary', expression);
    }
}

export const isPrimaryExpressionElementClass = (
    target: CommonClass,
): target is PrimaryExpressionElementClass => {
    return isCommonClass(target, PrimaryExpressionElementClass);
};

export class DotExpressionElementClass extends ExpressionElementClass<
    'dot',
    DotExpressionClass | null
> {
    constructor(expression: DotExpressionClass | null) {
        super('dot', expression);
    }
}

export const isDotExpressionElementClass = (
    target: CommonClass,
): target is DotExpressionElementClass => {
    return isCommonClass(target, DotExpressionElementClass);
};

export class MethodCallExpressionElementClass extends ExpressionElementClass<
    'methodCall',
    MethodCall
> {
    constructor(expression: MethodCall) {
        super('methodCall', expression);
    }
}

export const isMethodCallExpressionElementClass = (
    target: CommonClass,
): target is MethodCallExpressionElementClass => {
    return isCommonClass(target, MethodCallExpressionElementClass);
};

export class ArrayExpressionElementClass extends ExpressionElementClass<
    'array',
    ExpressionClass[]
> {
    constructor(expression: ExpressionClass[]) {
        super('array', expression);
    }
}

export const isArrayExpressionElementClass = (
    target: CommonClass,
): target is ArrayExpressionElementClass => {
    return isCommonClass(target, ArrayExpressionElementClass);
};

export class NewExpressionElementClass extends ExpressionElementClass<'new', Creator | null> {
    constructor(expression: Creator | null) {
        super('new', expression);
    }
}

export const isNewExpressionElementClass = (
    target: CommonClass,
): target is NewExpressionElementClass => {
    return isCommonClass(target, NewExpressionElementClass);
};

export class CastExpressionElementClass extends ExpressionElementClass<
    'cast',
    CastExpressionClass
> {
    constructor(expression: CastExpressionClass) {
        super('cast', expression);
    }
}

export const isCastExpressionElementClass = (
    target: CommonClass,
): target is CastExpressionElementClass => {
    return isCommonClass(target, CastExpressionElementClass);
};

export class SubExpressionElementClass extends ExpressionElementClass<
    'sub',
    ExpressionClass | null
> {
    constructor(expression: ExpressionClass | null) {
        super('sub', expression);
    }
}

export const isSubExpressionElementClass = (
    target: CommonClass,
): target is SubExpressionElementClass => {
    return isCommonClass(target, SubExpressionElementClass);
};

export class SingleOperatorExpressionElementClass extends ExpressionElementClass<
    'postOp' | 'preOp' | 'neg',
    SingleOperatorExpressionClass
> {
    constructor(type: 'postOp' | 'preOp' | 'neg', expression: SingleOperatorExpressionClass) {
        super(type, expression);
    }
}

export const isSingleOperatorExpressionElementClass = (
    target: CommonClass,
): target is SingleOperatorExpressionElementClass => {
    return isCommonClass(target, SingleOperatorExpressionElementClass);
};

export class ExpToExpOperatorExpressionElementClass extends ExpressionElementClass<
    | 'arth1'
    | 'arth2'
    | 'bit'
    | 'equality'
    | 'bitAnd'
    | 'bitOr'
    | 'bitNot'
    | 'assign'
    | 'cmp'
    | 'logAnd'
    | 'logOr'
    | 'coal',
    ExpToExpOperatorExpressionClass
> {
    constructor(
        type:
            | 'arth1'
            | 'arth2'
            | 'bit'
            | 'equality'
            | 'bitAnd'
            | 'bitOr'
            | 'bitNot'
            | 'assign'
            | 'cmp'
            | 'logAnd'
            | 'logOr'
            | 'coal',
        expression: ExpToExpOperatorExpressionClass,
    ) {
        super(type, expression);
    }
}

export const isExpToExpOperatorExpressionElementClass = (
    target: CommonClass,
): target is ExpToExpOperatorExpressionElementClass => {
    return isCommonClass(target, ExpToExpOperatorExpressionElementClass);
};

export class InstanceOfExpressionElementClass extends ExpressionElementClass<
    'instanceOf',
    InstanceOfExpressionClass
> {
    constructor(expression: InstanceOfExpressionClass) {
        super('instanceOf', expression);
    }
}

export const isInstanceOfExpressionElementClass = (
    target: CommonClass,
): target is InstanceOfExpressionElementClass => {
    return isCommonClass(target, InstanceOfExpressionElementClass);
};

export class CondExpressionElementClass extends ExpressionElementClass<
    'cond',
    CondExpressionClass
> {
    constructor(expression: CondExpressionClass) {
        super('cond', expression);
    }
}

export const isCondExpressionElementClass = (
    target: CommonClass,
): target is CondExpressionElementClass => {
    return isCommonClass(target, CondExpressionElementClass);
};

export class ExpressionClass extends CommonClass {
    private value:
        | NormalExpressionElementClass
        | PrimaryExpressionElementClass
        | DotExpressionElementClass
        | MethodCallExpressionElementClass
        | ArrayExpressionElementClass
        | NewExpressionElementClass
        | CastExpressionElementClass
        | SubExpressionElementClass
        | SingleOperatorExpressionElementClass
        | ExpToExpOperatorExpressionElementClass
        | InstanceOfExpressionElementClass
        | CondExpressionElementClass
        | null = null;

    setValue(
        value:
            | NormalExpressionElementClass
            | PrimaryExpressionElementClass
            | DotExpressionElementClass
            | MethodCallExpressionElementClass
            | ArrayExpressionElementClass
            | NewExpressionElementClass
            | CastExpressionElementClass
            | SubExpressionElementClass
            | SingleOperatorExpressionElementClass
            | ExpToExpOperatorExpressionElementClass
            | InstanceOfExpressionElementClass
            | CondExpressionElementClass
            | null,
    ): void {
        this.value = value;
    }

    getValue():
        | NormalExpressionElementClass
        | PrimaryExpressionElementClass
        | DotExpressionElementClass
        | MethodCallExpressionElementClass
        | ArrayExpressionElementClass
        | NewExpressionElementClass
        | CastExpressionElementClass
        | SubExpressionElementClass
        | SingleOperatorExpressionElementClass
        | ExpToExpOperatorExpressionElementClass
        | InstanceOfExpressionElementClass
        | CondExpressionElementClass
        | null {
        return this.value;
    }

    copy(commonClass: ExpressionClass) {
        this.setValue(commonClass.getValue());
    }
}

export const isExpressionClass = (target: CommonClass): target is ExpressionClass => {
    return target instanceof ExpressionClass;
};

export const expressionConvert = (
    target: ExpressionAllTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass => {
    const expressionClass = new ExpressionClass();

    if (isNormalExpressionType(target)) {
        const value = normalExpressionConvert(target, errorClass);
        if (value) {
            expressionClass.setValue(new NormalExpressionElementClass(value));
        }
    }
    if (isPrimaryExpressionType(target)) {
        const value = primaryExpressionConvert(target, errorClass);
        if (value) {
            expressionClass.setValue(new PrimaryExpressionElementClass(value));
        }
    }
    if (isDotExpressionType(target)) {
        expressionClass.setValue(
            new DotExpressionElementClass(dotExpressionConvert(target, errorClass)),
        );
    }
    if (isArrayExpressionType(target)) {
        expressionClass.setValue(
            new ArrayExpressionElementClass(arrayExpressionConvert(target, errorClass)),
        );
    }
    if (isMethodCallExpressionType(target)) {
        expressionClass.setValue(
            new MethodCallExpressionElementClass(methodCallExpressionConvert(target, errorClass)),
        );
    }
    if (isNewExpressionType(target)) {
        expressionClass.setValue(
            new NewExpressionElementClass(newExpressionConvert(target, errorClass)),
        );
    }
    if (isCastExpressionType(target)) {
        expressionClass.setValue(
            new CastExpressionElementClass(castExpressionConvert(target, errorClass)),
        );
    }
    if (isSubExpressionType(target)) {
        expression = { type: 'sub' };
        const value = subExpressionConvert(target, errorClass);
        if (value) {
            expressionClass.setValue(value);
        }
    }
    if (isPostOpExpressionType(target)) {
        const value = postOpExpressionConvert(target, errorClass);
        expression = {
            type: 'postOp',
            expression: value,
        };
    }
    if (isPreOpExpressionType(target)) {
        const value = preOpExpressionConvert(target, errorClass);
        expression = {
            type: 'preOp',
            expression: value,
        };
        if (isNegExpressionType(target)) {
            const value = negExpressionConvert(target, errorClass);
            expression = {
                type: 'neg',
                expression: value,
            };
        }
        if (isArth1ExpressionType(target)) {
            const value = arth1ExpressionConvert(target, errorClass);
            expression = {
                type: 'arth1',
                expression: value,
            };
        }
        if (isArth2ExpressionType(target)) {
            const value = arth2ExpressionConvert(target, errorClass);
            expression = {
                type: 'arth2',
                expression: value,
            };
        }
        if (isBitExpressionType(target)) {
            const value = bitExpressionConvert(target, errorClass);
            expression = {
                type: 'bit',
                expression: value,
            };
        }
        if (isBitAndExpressionType(target)) {
            const value = bitAndExpressionConvert(target, errorClass);
            expression = {
                type: 'bitAnd',
                expression: value,
            };
        }
        if (isBitOrExpressionType(target)) {
            const value = bitOrExpressionConvert(target, errorClass);
            expression = {
                type: 'bitOr',
                expression: value,
            };
        }
        if (isBitNotExpressionType(target)) {
            const value = bitNotExpressionConvert(target, errorClass);
            expression = {
                type: 'bitNot',
                expression: value,
            };
        }
        if (isAssignExpressionType(target)) {
            const value = assignExpressionConvert(target, errorClass);
            expression = {
                type: 'assign',
                expression: value,
            };
        }
        if (isCmpExpressionType(target)) {
            const value = cmpExpressionConvert(target, errorClass);
            expression = {
                type: 'cmp',
                expression: value,
            };
        }
        if (isInstanceOfExpressionType(target)) {
            const value = instanceOfExpressionConvert(target, errorClass);
            expression = {
                type: 'instanceOf',
                expression: value,
            };
        }
        if (isEqualityExpressionType(target)) {
            const value = equalityExpressionConvert(target, errorClass);
            expression = {
                type: 'equality',
                expression: value,
            };
        }
        if (isLogAndExpressionType(target)) {
            const value = logAndExpressionConvert(target, errorClass);
            expression = {
                type: 'logAnd',
                expression: value,
            };
        }
        if (isLogOrExpressionType(target)) {
            const value = logOrExpressionConvert(target, errorClass);
            expression = {
                type: 'logOr',
                expression: value,
            };
        }
        if (isCoalExpressionType(target)) {
            const value = coalExpressionConvert(target, errorClass);
            expression = {
                type: 'coal',
                expression: value,
            };
        }
        if (isCondExpressionType(target)) {
            const value = condExpressionConvert(target, errorClass);
            expression = {
                type: 'cond',
                expression: value,
            };
        }
    }
};
