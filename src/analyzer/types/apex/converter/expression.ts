import {
    CommonTypeClass,
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
    isFilteringExpressionType,
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
    MethodCallTypeClass,
    CreatorTypeClass,
    TypeRefTypeClass,
    DataCategorySelectionTypeClass,
    SoqlFunctionTypeClass,
    FieldNameTypeClass,
    ComparisonOperatorTypeClass,
    NormalValueTypeClass,
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
import { AnyId, anyIdConvert } from './id';
import { Primary, primaryConvert } from './primary';
import { fieldNameConvert } from './name';
import { MethodCall, methodCallConvert, DotMethodCall, dotMethodCallConvert } from './call';
import { TypeRef, typeRefConvert } from './type';

export type NormalExpression = string | null;

export const normalExpressionConvert = (
    target: NormalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): NormalExpression => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type PrimaryExpression = Primary | null;

export const primaryExpressionConvert = (
    target: PrimaryExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PrimaryExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isPrimaryTypeAll, errorClass);
    if (valueTypeClass) {
        return primaryConvert(valueTypeClass, errorClass);
    }

    return null;
};

export type DotExpression = {
    left: Expression | null;
    right: AnyId | DotMethodCall | null;
    operator: string | null;
};

export const dotExpressionConvert = (
    target: DotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): DotExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const operator = toPrimitiveValue(
        target.getOperator(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    const rightTypeClass = toTypeClass(
        target.getRight(),
        (target): target is AnyIdTypeClass | DotMethodCallTypeClass =>
            isAnyIdType(target) || isDotMethodCallType(target),
        errorClass,
    );

    let rightValue = null;
    if (rightTypeClass) {
        if (isAnyIdType(rightTypeClass)) {
            rightValue = anyIdConvert(rightTypeClass);
        }
        if (isDotMethodCallType(rightTypeClass)) {
            rightValue = dotMethodCallConvert(rightTypeClass, errorClass);
        }
    }

    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        operator: operator,
        right: rightValue,
    };
};

export type ArrayExpression = Expression[] | null;

export const arrayExpressionConvert = (
    target: ArrayExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ArrayExpression => {
    const values: any[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : null;
};

export type MethodCallExpression = MethodCall | null;

export const methodCallExpressionConvert = (
    target: MethodCallExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCallExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isMethodCallType, errorClass);
    if (valueTypeClass) {
        return methodCallConvert(valueTypeClass, errorClass);
    }
    return null;
};

export type NewExpression = CreatorTypeClass | null;

export const newExpressionConvert = (
    target: NewExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): NewExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isCreatorType, errorClass);
    if (valueTypeClass) {
        return valueTypeClass;
    }
    return null;
};

export type CastExpression = {
    value: Expression | null;
    valueType: TypeRef | null;
};

export const castExpressionConvert = (
    target: CastExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CastExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);

    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null,
        valueType: valueTypeTypeClass ? typeRefConvert(valueTypeTypeClass, errorClass) : null,
    };
};

export type SubExpression = Expression | null;

export const subExpressionConvert = (
    target: SubExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SubExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null;
};

export type PostOpExpression = {
    value: Expression | null;
    operator: string;
    location: 'post';
};

export const postOpExpressionConvert = (
    target: PostOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PostOpExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null,
        operator: target.getOperator(),
        location: 'post',
    };
};

export type PreOpExpression = {
    value: Expression | null;
    operator: string;
    location: 'pre';
};

export const preOpExpressionConvert = (
    target: PreOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PreOpExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null,
        operator: target.getOperator(),
        location: 'pre',
    };
};

export type NegExpression = {
    value: Expression | null;
    operator: string;
};

export const negExpressionConvert = (
    target: NegExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): NegExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null,
        operator: target.getOperator(),
    };
};

export type Arth1Expression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const arth1ExpressionConvert = (
    target: Arth1ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Arth1Expression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type Arth2Expression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const arth2ExpressionConvert = (
    target: Arth2ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Arth2Expression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const bitExpressionConvert = (
    target: BitExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type CmpExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const cmpExpressionConvert = (
    target: CmpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CmpExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type InstanceOfExpression = {
    left: Expression | null;
    right: TypeRef | null;
    operator: string | null;
};

export const instanceOfExpressionConvert = (
    target: InstanceOfExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): InstanceOfExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isTypeRefType, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? typeRefConvert(rightTypeClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type EqualityExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const equalityExpressionConvert = (
    target: EqualityExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): { left: any | null; right: any | null; operator: string | null } => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitAndExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const bitAndExpressionConvert = (
    target: BitAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitAndExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitNotExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const bitNotExpressionConvert = (
    target: BitNotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitNotExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitOrExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const bitOrExpressionConvert = (
    target: BitOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitOrExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type LogAndExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const logAndExpressionConvert = (
    target: LogAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogAndExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type LogOrExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const logOrExpressionConvert = (
    target: LogOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogOrExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type CoalExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const coalExpressionConvert = (
    target: CoalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CoalExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type CondExpression = {
    condition: Expression | null;
    trueValue: Expression | null;
    falseValue: Expression | null;
};

export const condExpressionConvert = (
    target: CondExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CondExpression => {
    const conditionTypeClass = toTypeClass(target.getCondition(), isExpressionTypeAll, errorClass);
    const trueValueTypeClass = toTypeClass(target.getTrueValue(), isExpressionTypeAll, errorClass);
    const falseValueTypeClass = toTypeClass(
        target.getFalseValue(),
        isExpressionTypeAll,
        errorClass,
    );
    return {
        condition: conditionTypeClass ? expressionConvert(conditionTypeClass, errorClass) : null,
        trueValue: trueValueTypeClass ? expressionConvert(trueValueTypeClass, errorClass) : null,
        falseValue: falseValueTypeClass ? expressionConvert(falseValueTypeClass, errorClass) : null,
    };
};

export type AssignExpression = {
    left: Expression | null;
    right: Expression | null;
    operator: string | null;
};

export const assignExpressionConvert = (
    target: AssignExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): AssignExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : null,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : null,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type ParExpression = Expression | null;

export const parExpressionConvert = (
    target: ParExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ParExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null;
};

export type BoundExpression = Expression | null;

export const boundExpressionConvert = (
    target: BoundExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BoundExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : null;
};

export type FilteringExpression = DataCategorySelectionTypeClass[] | null;

export const filteringExpressionConvert = (
    target: FilteringExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): FilteringExpression => {
    const values: DataCategorySelectionTypeClass[] = [];
    target.getValue().forEach((value) => {
        const valueTypeClass = toTypeClass(value, isDataCategorySelectionType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });

    return values.length > 0 ? values : null;
};

export type FieldExpression = {
    left: string[] | SoqlFunctionTypeClass | null;
    right: NormalValueTypeClass | null;
    operator: ComparisonOperatorTypeClass | null;
};

export const fieldExpressionConvert = (
    target: FieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): FieldExpression => {
    const leftTypeClass = toTypeClass(
        target.getLeft(),
        (target): target is FieldNameTypeClass | SoqlFunctionTypeClass =>
            isFieldNameType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    let left = null;
    if (leftTypeClass) {
        if (isFieldNameType(leftTypeClass)) {
            left = fieldNameConvert(leftTypeClass, errorClass);
        }
        if (isSoqlFunctionType(leftTypeClass)) {
            left = leftTypeClass;
        }
    }

    const rightTypeClass = toTypeClass(target.getRight(), isNormalValueType, errorClass);
    const operatorTypeClass = toTypeClass(
        target.getOperator(),
        isComparisonOperatorType,
        errorClass,
    );

    return {
        left: left,
        right: rightTypeClass,
        operator: operatorTypeClass,
    };
};

export type ConditionalExpression = LogicalExpression | FieldExpression | null;

export const conditionalExpressionConvert = (
    target: ConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ConditionalExpression => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is LogicalExpressionTypeClass | FieldExpressionTypeClass =>
            isLogicalExpressionType(target) || isFilteringExpressionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isLogicalExpressionType(valueTypeClass)) {
            return logicalExpressionConvert(valueTypeClass, errorClass);
        }
        if (isFilteringExpressionType(valueTypeClass)) {
            return fieldExpressionConvert(valueTypeClass, errorClass);
        }
    }

    return null;
};

export type LogicalExpression = {
    value: ConditionalExpression[] | null;
    operator: string | null;
};

export const logicalExpressionConvert = (
    target: LogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogicalExpression => {
    const value: any[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            value.push(conditionalExpressionConvert(valueTypeClass, errorClass));
        }
    });

    return {
        value: value.length > 0 ? value : null,
        operator: target.getOperator() ?? null,
    };
};

export type WhereFieldExpression = {
    left: string | FieldExpression | null;
    right: NormalValueTypeClass | null;
    operator: ComparisonOperatorTypeClass | null;
};

export const whereFieldExpressionConvert = (
    target: WhereFieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereFieldExpression => {
    let left = null;
    const leftTypeClass = target.getLeft();
    if (!(leftTypeClass instanceof CommonTypeClass)) {
        left = leftTypeClass;
    } else {
        if (isFieldExpressionType(leftTypeClass)) {
            left = fieldExpressionConvert(leftTypeClass, errorClass);
        }
    }

    let right = null;
    const rightTypeClass = target.getRight();
    if (rightTypeClass) {
        right = toTypeClass(rightTypeClass, isNormalValueType, errorClass);
    }

    let operator = null;
    const operatorTypeClass = target.getOperator();
    if (operatorTypeClass) {
        operator = toTypeClass(operatorTypeClass, isComparisonOperatorType, errorClass);
    }

    return {
        left: left,
        right: right,
        operator: operator,
    };
};

export type WhereConditionalExpression = WhereLogicalExpression | WhereFieldExpression;

export const whereConditionalExpressionConvert = (
    target: WhereConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): any | null => {
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

export type WhereLogicalExpression = {
    value: WhereConditionalExpression | null;
    operator: string | null;
};

export const whereLogicalExpressionConvert = (
    target: WhereLogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): { value: any[] | null; operator: string | null } => {
    const value: any[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isWhereConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            value.push(whereConditionalExpressionConvert(valueTypeClass, errorClass));
        }
    });

    return {
        value: value.length > 0 ? value : null,
        operator: target.getOperator() ?? null,
    };
};

export type Expression =
    | NormalExpression
    | PrimaryExpression
    | DotExpression
    | ArrayExpression
    | MethodCallExpression
    | NewExpression
    | CastExpression
    //   | SubExpression
    | PostOpExpression
    | PreOpExpression
    | NegExpression
    | Arth1Expression
    | Arth2Expression
    | BitExpression
    | CmpExpression
    | InstanceOfExpression
    | EqualityExpression
    | BitAndExpression
    | BitNotExpression
    | BitOrExpression
    | LogAndExpression
    | LogOrExpression
    | CoalExpression
    | CondExpression
    | AssignExpression
    | null;

export const expressionConvert = (
    target: ExpressionAllTypeClass,
    errorClass: ErrorTypeClass[],
): Expression => {
    if (isNormalExpressionType(target)) {
        return normalExpressionConvert(target, errorClass);
    }
    if (isPrimaryExpressionType(target)) {
        return primaryExpressionConvert(target, errorClass);
    }
    if (isDotExpressionType(target)) {
        return dotExpressionConvert(target, errorClass);
    }
    if (isArrayExpressionType(target)) {
        return arrayExpressionConvert(target, errorClass);
    }
    if (isMethodCallExpressionType(target)) {
        return methodCallExpressionConvert(target, errorClass);
    }
    if (isNewExpressionType(target)) {
        return newExpressionConvert(target, errorClass);
    }
    if (isCastExpressionType(target)) {
        return castExpressionConvert(target, errorClass);
    }
    if (isSubExpressionType(target)) {
        return subExpressionConvert(target, errorClass);
    }
    if (isPostOpExpressionType(target)) {
        return postOpExpressionConvert(target, errorClass);
    }
    if (isPreOpExpressionType(target)) {
        return preOpExpressionConvert(target, errorClass);
    }
    if (isNegExpressionType(target)) {
        return negExpressionConvert(target, errorClass);
    }
    if (isArth1ExpressionType(target)) {
        return arth1ExpressionConvert(target, errorClass);
    }
    if (isArth2ExpressionType(target)) {
        return arth2ExpressionConvert(target, errorClass);
    }
    if (isBitExpressionType(target)) {
        return bitExpressionConvert(target, errorClass);
    }
    if (isBitAndExpressionType(target)) {
        return bitAndExpressionConvert(target, errorClass);
    }
    if (isBitOrExpressionType(target)) {
        return bitOrExpressionConvert(target, errorClass);
    }
    if (isBitNotExpressionType(target)) {
        return bitNotExpressionConvert(target, errorClass);
    }
    if (isAssignExpressionType(target)) {
        return assignExpressionConvert(target, errorClass);
    }
    if (isCmpExpressionType(target)) {
        return cmpExpressionConvert(target, errorClass);
    }
    if (isInstanceOfExpressionType(target)) {
        return instanceOfExpressionConvert(target, errorClass);
    }
    if (isEqualityExpressionType(target)) {
        return equalityExpressionConvert(target, errorClass);
    }
    if (isLogAndExpressionType(target)) {
        return logAndExpressionConvert(target, errorClass);
    }
    if (isLogOrExpressionType(target)) {
        return logOrExpressionConvert(target, errorClass);
    }
    if (isCoalExpressionType(target)) {
        return coalExpressionConvert(target, errorClass);
    }
    if (isCondExpressionType(target)) {
        return condExpressionConvert(target, errorClass);
    }

    return null;
};
