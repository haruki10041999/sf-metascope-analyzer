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
import { anyIdConvert, isString, isStringArray } from './id';
import { PrimaryClass, primaryConvert, PrimaryElementClass } from './primary';
import { fieldNameConvert } from './name';
import {
    MethodCallClass,
    DotMethodCallClass,
    methodCallConvert,
    dotMethodCallConvert,
    isDotMethodCallClass,
} from './call';
import { TypeRefClass, typeRefConvert } from './type';
import { CreatorClass, creatorConvert } from './rest';
import { DataCategorySelectionClass, dataCategorySelectionConvert } from './clause';
import { NormalValueClass, normalValueConvert } from './value';
import {
    SoqlFunctionClass,
    comparisonOperatorConvert,
    isSoqlFunctionClass,
    soqlFunctionConvert,
} from './query';

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
): PrimaryClass => {
    const primaryClass = new PrimaryClass();

    const valueTypeClass = toTypeClass(target.getValue(), isPrimaryTypeAll, errorClass);
    if (valueTypeClass) {
        primaryClass.copy(primaryConvert(valueTypeClass, errorClass));
    }
    return primaryClass;
};

export class DotExpressionClass extends CommonClass {
    private left: ExpressionClass = new ExpressionClass();
    private operator: string | null = null;
    private right: string | DotMethodCallClass | null = null;

    setLeft(left: ExpressionClass): void {
        this.left.copy(left);
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: string | DotMethodCallClass | null): void {
        if (isDotMethodCallClass(this.right) && isDotMethodCallClass(right)) {
            this.right.copy(right);
        } else if (isString(this.right) && isString(right)) {
            this.right = right;
        } else {
            this.right = right;
        }
    }

    getLeft(): ExpressionClass {
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

export const isDotExpressionClass = (target: any): target is DotExpressionClass => {
    return isCommonClass(target, DotExpressionClass);
};

export const isDotExpressionClassArray = (target: any): target is DotExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isDotExpressionClass(t));
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
): ExpressionClass[] => {
    const values: ExpressionClass[] = [];

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
): MethodCallClass => {
    const methodCallExpression = new MethodCallClass();

    const valueTypeClass = toTypeClass(target.getValue(), isMethodCallType, errorClass);
    if (valueTypeClass) {
        methodCallExpression.copy(methodCallConvert(valueTypeClass, errorClass));
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

export const isCastExpressionClass = (target: any): target is CastExpressionClass => {
    return isCommonClass(target, CastExpressionClass);
};

export const isCastExpressionClassArray = (target: any): target is CastExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isCastExpressionClass(t));
};

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
): ExpressionClass => {
    const subExpression = new ExpressionClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        subExpression.copy(expressionConvert(valueTypeClass, errorClass));
    }
    return subExpression;
};

export class SingleOperatorExpressionClass extends CommonClass {
    private value = new ExpressionClass();
    private operator: string | null = null;
    private location: 'prefix' | 'postfix' | null = null;

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setLocation(location: 'prefix' | 'postfix' | null): void {
        this.location = location;
    }

    getValue(): ExpressionClass {
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
    target: any,
): target is SingleOperatorExpressionClass => {
    return isCommonClass(target, SingleOperatorExpressionClass);
};

export const isSingleOperatorExpressionClassArray = (
    target: any,
): target is SingleOperatorExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isSingleOperatorExpressionClass(t));
};

export const postOpExpressionConvert = (
    target: PostOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SingleOperatorExpressionClass => {
    const postOpExpression = new SingleOperatorExpressionClass();

    postOpExpression.setOperator(target.getOperator());
    postOpExpression.setLocation('postfix');

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        postOpExpression.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    return postOpExpression;
};

export const preOpExpressionConvert = (
    target: PreOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SingleOperatorExpressionClass => {
    const preOpExpression = new SingleOperatorExpressionClass();

    preOpExpression.setOperator(target.getOperator());
    preOpExpression.setLocation('prefix');

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        preOpExpression.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    return preOpExpression;
};

export const negExpressionConvert = (
    target: NegExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SingleOperatorExpressionClass => {
    const negExpression = new SingleOperatorExpressionClass();

    negExpression.setOperator(target.getOperator());
    negExpression.setLocation('prefix');

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        negExpression.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    return negExpression;
};

export class ExpToExpOperatorExpressionClass extends CommonClass {
    private left: ExpressionClass = new ExpressionClass();
    private operator: string | null = null;
    private right: ExpressionClass = new ExpressionClass();

    setLeft(left: ExpressionClass): void {
        this.left.copy(left);
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: ExpressionClass): void {
        this.right.copy(right);
    }

    getLeft(): ExpressionClass {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): ExpressionClass {
        return this.right;
    }

    copy(commonClass: ExpToExpOperatorExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isExpToExpOperatorExpressionClass = (
    target: any,
): target is ExpToExpOperatorExpressionClass => {
    return isCommonClass(target, ExpToExpOperatorExpressionClass);
};

export const isExpToExpOperatorExpressionClassArray = (
    target: any,
): target is ExpToExpOperatorExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isExpToExpOperatorExpressionClass(t));
};

export const arth1ExpressionConvert = (
    target: Arth1ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const arth1Expression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        arth1Expression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    arth1Expression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        arth1Expression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return arth1Expression;
};

export const arth2ExpressionConvert = (
    target: Arth2ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const arth2Expression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        arth2Expression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    arth2Expression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        arth2Expression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return arth2Expression;
};

export const bitExpressionConvert = (
    target: BitExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const bitExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        bitExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    bitExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        bitExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return bitExpression;
};

export const cmpExpressionConvert = (
    target: CmpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const cmpExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        cmpExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    cmpExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        cmpExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return cmpExpression;
};

export class InstanceOfExpressionClass extends CommonClass {
    private left: ExpressionClass = new ExpressionClass();
    private operator: string | null = null;
    private right: TypeRefClass = new TypeRefClass();

    setLeft(left: ExpressionClass): void {
        this.left.copy(left);
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: TypeRefClass): void {
        this.right.copy(right);
    }

    getLeft(): ExpressionClass {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): TypeRefClass {
        return this.right;
    }

    copy(commonClass: InstanceOfExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isInstanceOfExpressionClass = (target: any): target is InstanceOfExpressionClass => {
    return isCommonClass(target, InstanceOfExpressionClass);
};

export const isInstanceOfExpressionClassArray = (
    target: any,
): target is InstanceOfExpressionClass => {
    return Array.isArray(target) && target.every((t) => isInstanceOfExpressionClass(t));
};

export const instanceOfExpressionConvert = (
    target: InstanceOfExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): InstanceOfExpressionClass => {
    const instanceOfExpression = new InstanceOfExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        instanceOfExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    instanceOfExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isTypeRefType, errorClass);
    if (rightTypeClass) {
        instanceOfExpression.setRight(typeRefConvert(rightTypeClass, errorClass));
    }

    return instanceOfExpression;
};

export const equalityExpressionConvert = (
    target: EqualityExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const equalityExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        equalityExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    equalityExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        equalityExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return equalityExpression;
};

export const bitAndExpressionConvert = (
    target: BitAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const bitAndExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        bitAndExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    bitAndExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        bitAndExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return bitAndExpression;
};

export const bitNotExpressionConvert = (
    target: BitNotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const bitNotExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        bitNotExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    bitNotExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        bitNotExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return bitNotExpression;
};

export const bitOrExpressionConvert = (
    target: BitOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const bitOrExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        bitOrExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    bitOrExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        bitOrExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return bitOrExpression;
};

export const logAndExpressionConvert = (
    target: LogAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const logAndExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        logAndExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    logAndExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        logAndExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return logAndExpression;
};

export const logOrExpressionConvert = (
    target: LogOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const logOrExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        logOrExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    logOrExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        logOrExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return logOrExpression;
};

export const coalExpressionConvert = (
    target: CoalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const coalExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        coalExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    coalExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        coalExpression.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return coalExpression;
};

export class CondExpressionClass extends CommonClass {
    private condition: ExpressionClass = new ExpressionClass();
    private trueValue: ExpressionClass = new ExpressionClass();
    private falseValue: ExpressionClass = new ExpressionClass();

    setCondition(condition: ExpressionClass): void {
        this.condition.copy(condition);
    }

    setTrueValue(trueValue: ExpressionClass): void {
        this.trueValue.copy(trueValue);
    }

    setFalseValue(falseValue: ExpressionClass): void {
        this.falseValue.copy(falseValue);
    }

    getCondition(): ExpressionClass {
        return this.condition;
    }

    getTrueValue(): ExpressionClass {
        return this.trueValue;
    }

    getFalseValue(): ExpressionClass {
        return this.falseValue;
    }

    copy(commonClass: CondExpressionClass): void {
        this.setCondition(commonClass.getCondition());
        this.setTrueValue(commonClass.getTrueValue());
        this.setFalseValue(commonClass.getFalseValue());
    }
}

export const isCondExpressionClass = (target: any): target is CondExpressionClass => {
    return isCommonClass(target, CondExpressionClass);
};

export const isCondExpressionClassArray = (target: any): target is CondExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isCondExpressionClass(t));
};

export const condExpressionConvert = (
    target: CondExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CondExpressionClass => {
    const condExpression = new CondExpressionClass();

    const conditionTypeClass = toTypeClass(target.getCondition(), isExpressionTypeAll, errorClass);
    if (conditionTypeClass) {
        condExpression.setCondition(expressionConvert(conditionTypeClass, errorClass));
    }

    const trueTypeClass = toTypeClass(target.getTrueValue(), isExpressionTypeAll, errorClass);
    if (trueTypeClass) {
        condExpression.setTrueValue(expressionConvert(trueTypeClass, errorClass));
    }

    const falseTypeClass = toTypeClass(target.getFalseValue(), isExpressionTypeAll, errorClass);
    if (falseTypeClass) {
        condExpression.setFalseValue(expressionConvert(falseTypeClass, errorClass));
    }

    return condExpression;
};

export const assignExpressionConvert = (
    target: AssignExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ExpToExpOperatorExpressionClass => {
    const assignExpression = new ExpToExpOperatorExpressionClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        assignExpression.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    assignExpression.setOperator(
        toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        assignExpression.setRight(expressionConvert(rightTypeClass, errorClass));
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
): ExpressionClass => {
    const boundExpression = new ExpressionClass();
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        boundExpression.copy(expressionConvert(valueTypeClass, errorClass));
    }

    return boundExpression;
};

export const filteringExpressionConvert = (
    target: FilteringExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategorySelectionClass[] => {
    const values: DataCategorySelectionClass[] = [];
    target.getValue().forEach((value) => {
        const valueTypeClass = toTypeClass(value, isDataCategorySelectionType, errorClass);
        if (valueTypeClass) {
            values.push(dataCategorySelectionConvert(valueTypeClass, errorClass));
        }
    });

    return values;
};

export class FieldExpressionClass extends CommonClass {
    private left: string[] | SoqlFunctionClass | null = null;
    private operator: string | null = null;
    private right: NormalValueClass = new NormalValueClass();

    setLeft(left: string[] | SoqlFunctionClass | null): void {
        if (isSoqlFunctionClass(this.left) && isSoqlFunctionClass(left)) {
            this.left.copy(left);
        } else if (isStringArray(this.left) && isStringArray(left)) {
            this.left.push(...left);
        } else {
            this.left = left;
        }
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: NormalValueClass): void {
        this.right.copy(right);
    }

    getLeft(): string[] | SoqlFunctionClass | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): NormalValueClass {
        return this.right;
    }

    copy(commonClass: FieldExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isFieldExpressionClass = (target: any): target is FieldExpressionClass => {
    return isCommonClass(target, FieldExpressionClass);
};

export const isFieldExpressionClassArray = (target: any): target is FieldExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isFieldExpressionClass(t));
};

export const fieldExpressionConvert = (
    target: FieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): FieldExpressionClass => {
    const fieldExpression = new FieldExpressionClass();

    const leftTypeClass = toTypeClass(
        target.getLeft(),
        (target): target is FieldNameTypeClass | SoqlFunctionTypeClass =>
            isFieldNameType(target) || isSoqlFunctionType(target),
        errorClass,
    );
    if (leftTypeClass) {
        if (isFieldNameType(leftTypeClass)) {
            fieldExpression.setLeft(fieldNameConvert(leftTypeClass, errorClass));
        }
        if (isSoqlFunctionType(leftTypeClass)) {
            fieldExpression.setLeft(soqlFunctionConvert(leftTypeClass, errorClass));
        }
    }

    const operatorTypeClass = toTypeClass(
        target.getOperator(),
        isComparisonOperatorType,
        errorClass,
    );
    if (operatorTypeClass) {
        fieldExpression.setOperator(comparisonOperatorConvert(operatorTypeClass, errorClass));
    }

    const rightTypeClass = toTypeClass(target.getRight(), isNormalValueType, errorClass);
    if (rightTypeClass) {
        fieldExpression.setRight(normalValueConvert(rightTypeClass, errorClass));
    }

    return fieldExpression;
};

export const conditionalExpressionConvert = (
    target: ConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogicalExpressionClass | FieldExpressionClass | null => {
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

export const isConditionalExpression = (
    target: any,
): target is LogicalExpressionClass | FieldExpressionClass => {
    return isLogicalExpressionClass(target) || isFieldExpressionClass(target);
};

export const isConditionalExpressionArray = (
    target: any,
): target is (LogicalExpressionClass | FieldExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isConditionalExpression(t));
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

export const isLogicalExpressionClass = (target: any): target is LogicalExpressionClass => {
    return isCommonClass(target, LogicalExpressionClass);
};

export const isLogicalExrpressionClassArray = (target: any): target is LogicalExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isLogicalExpressionClass(t));
};

export const logicalExpressionConvert = (
    target: LogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogicalExpressionClass => {
    const logicalExpression = new LogicalExpressionClass();

    const values: (LogicalExpressionClass | FieldExpressionClass)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            const expression = conditionalExpressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });
    logicalExpression.setValue(values);
    logicalExpression.setOperator(target.getOperator());

    return logicalExpression;
};

export class WhereFieldExpressionClass extends CommonClass {
    private left: string | FieldExpressionClass | null = null;
    private operator: string | null = null;
    private right: NormalValueClass = new NormalValueClass();

    setLeft(left: string | FieldExpressionClass | null): void {
        if (isFieldExpressionClass(this.left) && isFieldExpressionClass(left)) {
            this.left.copy(left);
        } else if (isString(this.left) && isString(left)) {
            this.left = left;
        } else {
            this.left = left;
        }
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    setRight(right: NormalValueClass): void {
        this.right.copy(right);
    }

    getLeft(): string | FieldExpressionClass | null {
        return this.left;
    }

    getOperator(): string | null {
        return this.operator;
    }

    getRight(): NormalValueClass {
        return this.right;
    }

    copy(commonClass: WhereFieldExpressionClass): void {
        this.setLeft(commonClass.getLeft());
        this.setOperator(commonClass.getOperator());
        this.setRight(commonClass.getRight());
    }
}

export const isWhereFieldExpressionClass = (target: any): target is WhereFieldExpressionClass => {
    return isCommonClass(target, WhereFieldExpressionClass);
};

export const isWhereFieldExpressionClassArray = (
    target: any,
): target is WhereFieldExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isWhereFieldExpressionClass(t));
};

export const whereFieldExpressionConvert = (
    target: WhereFieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereFieldExpressionClass => {
    const whereFieldExpression = new WhereFieldExpressionClass();

    const leftTypeClass = target.getLeft();
    if (typeof leftTypeClass === 'string') {
        whereFieldExpression.setLeft(leftTypeClass);
    } else {
        const fieldTypeClass = toTypeClass(leftTypeClass, isFieldExpressionType, errorClass);
        if (fieldTypeClass) {
            whereFieldExpression.setLeft(fieldExpressionConvert(fieldTypeClass, errorClass));
        }
    }

    const operatorValue = target.getOperator();
    if (operatorValue) {
        const typeClass = toTypeClass(operatorValue, isComparisonOperatorType, errorClass);
        if (typeClass) {
            whereFieldExpression.setOperator(comparisonOperatorConvert(typeClass, errorClass));
        }
    }

    const rightValue = target.getRight();
    if (rightValue) {
        const typeClass = toTypeClass(rightValue, isNormalValueType, errorClass);
        if (typeClass) {
            whereFieldExpression.setRight(normalValueConvert(typeClass, errorClass));
        }
    }

    return whereFieldExpression;
};

export const whereConditionalExpressionConvert = (
    target: WhereConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpressionClass | WhereFieldExpressionClass | null => {
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

export const isWhereConditionalExpression = (
    target: any,
): target is WhereLogicalExpressionClass | WhereFieldExpressionClass => {
    return isWhereLogicalExpressionClass(target) || isWhereFieldExpressionClass(target);
};

export const isWhereConditionalExpressionArray = (
    target: any,
): target is (LogicalExpressionClass | FieldExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isWhereConditionalExpression(t));
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
    target: any,
): target is WhereLogicalExpressionClass => {
    return isCommonClass(target, WhereLogicalExpressionClass);
};

export const isWhereLogicalExrpressionClassArray = (
    target: any,
): target is LogicalExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isWhereLogicalExpressionClass(t));
};

export const whereLogicalExpressionConvert = (
    target: WhereLogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpressionClass => {
    const whereLogicalExpression = new WhereLogicalExpressionClass();

    const values: (WhereLogicalExpressionClass | WhereFieldExpressionClass)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isWhereConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            const expression = whereConditionalExpressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });
    whereLogicalExpression.setValue(values);

    whereLogicalExpression.setOperator(target.getOperator());

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

export class PrimaryExpressionElementClass extends ExpressionElementClass<'primary', PrimaryClass> {
    constructor(expression: PrimaryClass) {
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
    MethodCallClass
> {
    constructor(expression: MethodCallClass) {
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

export class NewExpressionElementClass extends ExpressionElementClass<'new', CreatorClass> {
    constructor(expression: CreatorClass) {
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

export const isExpressionClass = (target: any): target is ExpressionClass => {
    return isCommonClass(target, ExpressionClass);
};

export const isExpressionClassArray = (target: any): target is ExpressionClass[] => {
    return Array.isArray(target) && target.every((t) => isExpressionClass(t));
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
        expressionClass.setValue(
            new SubExpressionElementClass(subExpressionConvert(target, errorClass)),
        );
    }
    if (isPostOpExpressionType(target)) {
        expressionClass.setValue(
            new SingleOperatorExpressionElementClass(
                'postOp',
                postOpExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isPreOpExpressionType(target)) {
        expressionClass.setValue(
            new SingleOperatorExpressionElementClass(
                'preOp',
                preOpExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isNegExpressionType(target)) {
        expressionClass.setValue(
            new SingleOperatorExpressionElementClass(
                'neg',
                negExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isArth1ExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'arth1',
                arth1ExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isArth2ExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'arth2',
                arth2ExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isBitExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'bit',
                bitExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isBitAndExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'bitAnd',
                bitAndExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isBitOrExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'bitOr',
                bitOrExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isBitNotExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'bitNot',
                bitNotExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isAssignExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'assign',
                assignExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isCmpExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'cmp',
                cmpExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isInstanceOfExpressionType(target)) {
        expressionClass.setValue(
            new InstanceOfExpressionElementClass(instanceOfExpressionConvert(target, errorClass)),
        );
    }
    if (isEqualityExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'equality',
                equalityExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isLogAndExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'logAnd',
                logAndExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isLogOrExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'logOr',
                logOrExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isCoalExpressionType(target)) {
        expressionClass.setValue(
            new ExpToExpOperatorExpressionElementClass(
                'coal',
                coalExpressionConvert(target, errorClass),
            ),
        );
    }
    if (isCondExpressionType(target)) {
        expressionClass.setValue(
            new CondExpressionElementClass(condExpressionConvert(target, errorClass)),
        );
    }

    return expressionClass;
};
