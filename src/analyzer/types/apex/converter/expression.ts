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
import { AnyId, anyIdConvert } from './id';
import { Primary, primaryConvert } from './primary';
import { FieldName, fieldNameConvert } from './name';
import { MethodCall, methodCallConvert, DotMethodCall, dotMethodCallConvert } from './call';
import { TypeRef, typeRefConvert } from './type';
import { Creator, creatorConvert } from './rest';
import { DataCategorySelection, dataCategorySelectionConvert } from './clause';
import { NormalValue, normalValueConvert } from './value';
import {
    ComparisonOperator,
    comparisonOperatorConvert,
    SoqlFunction,
    soqlFunctionConvert,
} from './query';

export type NormalExpression = string | undefined;

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

export type PrimaryExpression = Primary | undefined;

export const primaryExpressionConvert = (
    target: PrimaryExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PrimaryExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isPrimaryTypeAll, errorClass);
    if (valueTypeClass) {
        return primaryConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export type DotExpression = {
    left: Expression | undefined;
    right: AnyId | DotMethodCall | undefined;
    operator: string | undefined;
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

    let rightValue = undefined;
    if (rightTypeClass) {
        if (isAnyIdType(rightTypeClass)) {
            rightValue = anyIdConvert(rightTypeClass);
        }
        if (isDotMethodCallType(rightTypeClass)) {
            rightValue = dotMethodCallConvert(rightTypeClass, errorClass);
        }
    }

    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        operator: operator,
        right: rightValue,
    };
};

export type ArrayExpression = Expression[] | undefined;

export const arrayExpressionConvert = (
    target: ArrayExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ArrayExpression => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type MethodCallExpression = MethodCall | undefined;

export const methodCallExpressionConvert = (
    target: MethodCallExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCallExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isMethodCallType, errorClass);
    if (valueTypeClass) {
        return methodCallConvert(valueTypeClass, errorClass);
    }
    return undefined;
};

export type NewExpression = Creator | undefined;

export const newExpressionConvert = (
    target: NewExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): NewExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isCreatorType, errorClass);
    return valueTypeClass ? creatorConvert(valueTypeClass, errorClass) : undefined;
};

export type CastExpression = {
    value: Expression | undefined;
    valueType: TypeRef | undefined;
};

export const castExpressionConvert = (
    target: CastExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CastExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);

    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined,
        valueType: valueTypeTypeClass ? typeRefConvert(valueTypeTypeClass, errorClass) : undefined,
    };
};

export type SubExpression = Expression | undefined;

export const subExpressionConvert = (
    target: SubExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): SubExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined;
};

export type PostOpExpression = {
    value: Expression | undefined;
    operator: string;
    location: 'post';
};

export const postOpExpressionConvert = (
    target: PostOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PostOpExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined,
        operator: target.getOperator(),
        location: 'post',
    };
};

export type PreOpExpression = {
    value: Expression | undefined;
    operator: string;
    location: 'pre';
};

export const preOpExpressionConvert = (
    target: PreOpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): PreOpExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined,
        operator: target.getOperator(),
        location: 'pre',
    };
};

export type NegExpression = {
    value: Expression | undefined;
    operator: string;
};

export const negExpressionConvert = (
    target: NegExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): NegExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return {
        value: valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined,
        operator: target.getOperator(),
    };
};

export type Arth1Expression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const arth1ExpressionConvert = (
    target: Arth1ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Arth1Expression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type Arth2Expression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const arth2ExpressionConvert = (
    target: Arth2ExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): Arth2Expression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const bitExpressionConvert = (
    target: BitExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type CmpExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const cmpExpressionConvert = (
    target: CmpExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CmpExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type InstanceOfExpression = {
    left: Expression | undefined;
    right: TypeRef | undefined;
    operator: string | undefined;
};

export const instanceOfExpressionConvert = (
    target: InstanceOfExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): InstanceOfExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isTypeRefType, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? typeRefConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type EqualityExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const equalityExpressionConvert = (
    target: EqualityExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): EqualityExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitAndExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const bitAndExpressionConvert = (
    target: BitAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitAndExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitNotExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const bitNotExpressionConvert = (
    target: BitNotExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitNotExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type BitOrExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const bitOrExpressionConvert = (
    target: BitOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BitOrExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type LogAndExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const logAndExpressionConvert = (
    target: LogAndExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogAndExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type LogOrExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const logOrExpressionConvert = (
    target: LogOrExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogOrExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type CoalExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const coalExpressionConvert = (
    target: CoalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): CoalExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type CondExpression = {
    condition: Expression | undefined;
    trueValue: Expression | undefined;
    falseValue: Expression | undefined;
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
        condition: conditionTypeClass
            ? expressionConvert(conditionTypeClass, errorClass)
            : undefined,
        trueValue: trueValueTypeClass
            ? expressionConvert(trueValueTypeClass, errorClass)
            : undefined,
        falseValue: falseValueTypeClass
            ? expressionConvert(falseValueTypeClass, errorClass)
            : undefined,
    };
};

export type AssignExpression = {
    left: Expression | undefined;
    right: Expression | undefined;
    operator: string | undefined;
};

export const assignExpressionConvert = (
    target: AssignExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): AssignExpression => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
        operator: toPrimitiveValue(
            target.getOperator(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    };
};

export type ParExpression = Expression | undefined;

export const parExpressionConvert = (
    target: ParExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ParExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined;
};

export type BoundExpression = Expression | undefined;

export const boundExpressionConvert = (
    target: BoundExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): BoundExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    return valueTypeClass ? expressionConvert(valueTypeClass, errorClass) : undefined;
};

export type FilteringExpression = DataCategorySelection[] | undefined;

export const filteringExpressionConvert = (
    target: FilteringExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): FilteringExpression => {
    const values: DataCategorySelection[] = [];
    target.getValue().forEach((value) => {
        const valueTypeClass = toTypeClass(value, isDataCategorySelectionType, errorClass);
        if (valueTypeClass) {
            values.push(dataCategorySelectionConvert(valueTypeClass, errorClass));
        }
    });

    return values.length > 0 ? values : undefined;
};

export type FieldExpression = {
    left: FieldName | SoqlFunction | undefined;
    right: NormalValue | undefined;
    operator: ComparisonOperator;
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

    let left: FieldExpression['left'] = undefined;
    if (leftTypeClass) {
        if (isFieldNameType(leftTypeClass)) {
            left = fieldNameConvert(leftTypeClass, errorClass);
        }
        if (isSoqlFunctionType(leftTypeClass)) {
            left = soqlFunctionConvert(leftTypeClass, errorClass);
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
        right: rightTypeClass ? normalValueConvert(rightTypeClass, errorClass) : undefined,
        operator: operatorTypeClass
            ? comparisonOperatorConvert(operatorTypeClass, errorClass)
            : undefined,
    };
};

export type ConditionalExpression = LogicalExpression | FieldExpression | undefined;

export const conditionalExpressionConvert = (
    target: ConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): ConditionalExpression => {
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
    value: ConditionalExpression[] | undefined;
    operator: string | undefined;
};

export const logicalExpressionConvert = (
    target: LogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): LogicalExpression => {
    const value: ConditionalExpression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            value.push(conditionalExpressionConvert(valueTypeClass, errorClass));
        }
    });

    return {
        value: value.length > 0 ? value : undefined,
        operator: target.getOperator() ?? undefined,
    };
};

export type WhereFieldExpression = {
    left: string | FieldExpression | undefined;
    right: NormalValue | undefined;
    operator: ComparisonOperator;
};

export const whereFieldExpressionConvert = (
    target: WhereFieldExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereFieldExpression => {
    let left: WhereFieldExpression['left'] = undefined;
    const leftTypeClass = target.getLeft();
    if (typeof leftTypeClass === 'string') {
        left = leftTypeClass;
    } else {
        const fieldTypeClass = toTypeClass(leftTypeClass, isFieldExpressionType, errorClass);
        left = fieldTypeClass ? fieldExpressionConvert(fieldTypeClass, errorClass) : undefined;
    }

    const rightValue = target.getRight();
    const rightTypeClass = rightValue
        ? toTypeClass(rightValue, isNormalValueType, errorClass)
        : undefined;

    const operatorValue = target.getOperator();
    const operatorTypeClass = operatorValue
        ? toTypeClass(operatorValue, isComparisonOperatorType, errorClass)
        : undefined;

    return {
        left: left,
        right: rightTypeClass ? normalValueConvert(rightTypeClass, errorClass) : undefined,
        operator: operatorTypeClass
            ? comparisonOperatorConvert(operatorTypeClass, errorClass)
            : undefined,
    };
};

export type WhereConditionalExpression = WhereLogicalExpression | WhereFieldExpression | undefined;

export const whereConditionalExpressionConvert = (
    target: WhereConditionalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereConditionalExpression => {
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
    value: WhereConditionalExpression[] | undefined;
    operator: string | undefined;
};

export const whereLogicalExpressionConvert = (
    target: WhereLogicalExpressionTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpression => {
    const value: WhereConditionalExpression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isWhereConditionalExpressionType, errorClass);
        if (valueTypeClass) {
            value.push(whereConditionalExpressionConvert(valueTypeClass, errorClass));
        }
    });

    return {
        value: value.length > 0 ? value : undefined,
        operator: target.getOperator() ?? undefined,
    };
};

export type Expression =
    | {
          type: 'normal';
          expression: NormalExpression;
      }
    | {
          type: 'primary';
          expression: PrimaryExpression;
      }
    | {
          type: 'dot';
          expression: DotExpression;
      }
    | {
          type: 'array';
          expression: ArrayExpression;
      }
    | {
          type: 'methodCall';
          expression: MethodCallExpression;
      }
    | {
          type: 'new';
          expression: NewExpression;
      }
    | {
          type: 'cast';
          expression: CastExpression;
      }
    | {
          type: 'sub';
          expression: SubExpression;
      }
    | {
          type: 'postOp';
          expression: PostOpExpression;
      }
    | {
          type: 'preOp';
          expression: PreOpExpression;
      }
    | {
          type: 'neg';
          expression: NegExpression;
      }
    | {
          type: 'arth1';
          expression: Arth1Expression;
      }
    | {
          type: 'arth2';
          expression: Arth2Expression;
      }
    | {
          type: 'bit';
          expression: BitExpression;
      }
    | {
          type: 'cmp';
          expression: CmpExpression;
      }
    | {
          type: 'instanceOf';
          expression: InstanceOfExpression;
      }
    | {
          type: 'equality';
          expression: EqualityExpression;
      }
    | {
          type: 'bitAnd';
          expression: BitAndExpression;
      }
    | {
          type: 'bitNot';
          expression: BitNotExpression;
      }
    | {
          type: 'bitOr';
          expression: BitOrExpression;
      }
    | {
          type: 'logAnd';
          expression: LogAndExpression;
      }
    | {
          type: 'logOr';
          expression: LogOrExpression;
      }
    | {
          type: 'coal';
          expression: CoalExpression;
      }
    | {
          type: 'cond';
          expression: CondExpression;
      }
    | {
          type: 'assign';
          expression: AssignExpression;
      }
    | undefined;

export const expressionConvert = (
    target: ExpressionAllTypeClass,
    errorClass: ErrorTypeClass[],
): Expression => {
    if (isNormalExpressionType(target)) {
        return {
            type: 'normal',
            expression: normalExpressionConvert(target, errorClass),
        };
    }
    if (isPrimaryExpressionType(target)) {
        return {
            type: 'primary',
            expression: primaryExpressionConvert(target, errorClass),
        };
    }
    if (isDotExpressionType(target)) {
        return {
            type: 'dot',
            expression: dotExpressionConvert(target, errorClass),
        };
    }
    if (isArrayExpressionType(target)) {
        return {
            type: 'array',
            expression: arrayExpressionConvert(target, errorClass),
        };
    }
    if (isMethodCallExpressionType(target)) {
        return {
            type: 'methodCall',
            expression: methodCallExpressionConvert(target, errorClass),
        };
    }
    if (isNewExpressionType(target)) {
        return {
            type: 'new',
            expression: newExpressionConvert(target, errorClass),
        };
    }
    if (isCastExpressionType(target)) {
        return {
            type: 'cast',
            expression: castExpressionConvert(target, errorClass),
        };
    }
    if (isSubExpressionType(target)) {
        return {
            type: 'sub',
            expression: subExpressionConvert(target, errorClass),
        };
    }
    if (isPostOpExpressionType(target)) {
        return {
            type: 'postOp',
            expression: postOpExpressionConvert(target, errorClass),
        };
    }
    if (isPreOpExpressionType(target)) {
        return {
            type: 'preOp',
            expression: preOpExpressionConvert(target, errorClass),
        };
    }
    if (isNegExpressionType(target)) {
        return {
            type: 'neg',
            expression: negExpressionConvert(target, errorClass),
        };
    }
    if (isArth1ExpressionType(target)) {
        return {
            type: 'arth1',
            expression: arth1ExpressionConvert(target, errorClass),
        };
    }
    if (isArth2ExpressionType(target)) {
        return {
            type: 'arth2',
            expression: arth2ExpressionConvert(target, errorClass),
        };
    }
    if (isBitExpressionType(target)) {
        return {
            type: 'bit',
            expression: bitExpressionConvert(target, errorClass),
        };
    }
    if (isBitAndExpressionType(target)) {
        return {
            type: 'bitAnd',
            expression: bitAndExpressionConvert(target, errorClass),
        };
    }
    if (isBitOrExpressionType(target)) {
        return {
            type: 'bitOr',
            expression: bitOrExpressionConvert(target, errorClass),
        };
    }
    if (isBitNotExpressionType(target)) {
        return {
            type: 'bitNot',
            expression: bitNotExpressionConvert(target, errorClass),
        };
    }
    if (isAssignExpressionType(target)) {
        return {
            type: 'assign',
            expression: assignExpressionConvert(target, errorClass),
        };
    }
    if (isCmpExpressionType(target)) {
        return {
            type: 'cmp',
            expression: cmpExpressionConvert(target, errorClass),
        };
    }
    if (isInstanceOfExpressionType(target)) {
        return {
            type: 'instanceOf',
            expression: instanceOfExpressionConvert(target, errorClass),
        };
    }
    if (isEqualityExpressionType(target)) {
        return {
            type: 'equality',
            expression: equalityExpressionConvert(target, errorClass),
        };
    }
    if (isLogAndExpressionType(target)) {
        return {
            type: 'logAnd',
            expression: logAndExpressionConvert(target, errorClass),
        };
    }
    if (isLogOrExpressionType(target)) {
        return {
            type: 'logOr',
            expression: logOrExpressionConvert(target, errorClass),
        };
    }
    if (isCoalExpressionType(target)) {
        return {
            type: 'coal',
            expression: coalExpressionConvert(target, errorClass),
        };
    }
    if (isCondExpressionType(target)) {
        return {
            type: 'cond',
            expression: condExpressionConvert(target, errorClass),
        };
    }

    return undefined;
};
