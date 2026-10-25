import {
    ArrayExpressionTypeClass,
    Arth1ExpressionTypeClass,
    Arth2ExpressionTypeClass,
    AssignExpressionTypeClass,
    BitAndExpressionTypeClass,
    BitExpressionTypeClass,
    BitNotExpressionTypeClass,
    BitOrExpressionTypeClass,
    BoundExpressionTypeClass,
    CastExpressionTypeClass,
    CmpExpressionTypeClass,
    CoalExpressionTypeClass,
    CondExpressionTypeClass,
    ConditionalExpressionTypeClass,
    DotExpressionTypeClass,
    EqualityExpressionTypeClass,
    FieldExpressionTypeClass,
    FilteringExpressionTypeClass,
    InstanceOfExpressionTypeClass,
    LogAndExpressionTypeClass,
    LogicalExpressionTypeClass,
    LogOrExpressionTypeClass,
    MethodCallExpressionTypeClass,
    NegExpressionTypeClass,
    NewExpressionTypeClass,
    NormalExpressionTypeClass,
    ParExpressionTypeClass,
    PostOpExpressionTypeClass,
    PreOpExpressionTypeClass,
    PrimaryExpressionTypeClass,
    SubExpressionTypeClass,
    WhereConditionalExpressionTypeClass,
    WhereFieldExpressionTypeClass,
    WhereLogicalExpressionTypeClass,
    isArrayExpressionType as isArrayExpressionTypeClass,
    isArth1ExpressionType as isArth1ExpressionTypeClass,
    isArth2ExpressionType as isArth2ExpressionTypeClass,
    isAssignExpressionType as isAssignExpressionTypeClass,
    isBitAndExpressionType as isBitAndExpressionTypeClass,
    isBitExpressionType as isBitExpressionTypeClass,
    isBitNotExpressionType as isBitNotExpressionTypeClass,
    isBitOrExpressionType as isBitOrExpressionTypeClass,
    isBoundExpressionType as isBoundExpressionTypeClass,
    isCastExpressionType as isCastExpressionTypeClass,
    isCmpExpressionType as isCmpExpressionTypeClass,
    isCoalExpressionType as isCoalExpressionTypeClass,
    isCondExpressionType as isCondExpressionTypeClass,
    isConditionalExpressionType as isConditionalExpressionTypeClass,
    isDotExpressionType as isDotExpressionTypeClass,
    isEqualityExpressionType as isEqualityExpressionTypeClass,
    isFieldExpressionType as isFieldExpressionTypeClass,
    isFilteringExpressionType as isFilteringExpressionTypeClass,
    isInstanceOfExpressionType as isInstanceOfExpressionTypeClass,
    isLogAndExpressionType as isLogAndExpressionTypeClass,
    isLogicalExpressionType as isLogicalExpressionTypeClass,
    isLogOrExpressionType as isLogOrExpressionTypeClass,
    isMethodCallExpressionType as isMethodCallExpressionTypeClass,
    isNegExpressionType as isNegExpressionTypeClass,
    isNewExpressionType as isNewExpressionTypeClass,
    isNormalExpressionType as isNormalExpressionTypeClass,
    isParExpressionType as isParExpressionTypeClass,
    isPostOpExpressionType as isPostOpExpressionTypeClass,
    isPreOpExpressionType as isPreOpExpressionTypeClass,
    isPrimaryExpressionType as isPrimaryExpressionTypeClass,
    isSubExpressionType as isSubExpressionTypeClass,
    isWhereConditionalExpressionType as isWhereConditionalExpressionTypeClass,
    isWhereFieldExpressionType as isWhereFieldExpressionTypeClass,
    isWhereLogicalExpressionType as isWhereLogicalExpressionTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeStringAssignRule,
    makeLimitedStringAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeAnyIdAssignRule, AnyIdType } from './id';
import { makeBasePrimaryAssignRules, BasePrimaryType } from './primary';
import { makeFieldNameAssignRule, FieldNameType } from './name';
import {
    makeSoqlFunctionAssignRule,
    makeComparisonOperatorAssignRule,
    SoqlFunctionType,
    ComparisonOperatorType,
} from './query';
import { makeValueAssignRule, ValueType } from './value';
import { makeDataCategorySelectionAssignRule, DataCategorySelectionType } from './clause';
import { makeCreatorAssignRule, CreatorType } from './rest';
import { makeTypeRefAssignRule, TypeRefType } from './type';
import {
    makeDotMethodCallAssignRule,
    makeMethodCallAssignRule,
    MethodCallType,
    DotMethodCallType,
} from './call';

export type ArrayExpressionType = CommonType<'arrayExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    index: ValueRuleValue<BaseExpressionType>;
};

export const isArrayExpressionType = (value: unknown): value is ArrayExpressionType => {
    return isCommonType(value) && value.type === 'arrayExpression';
};

export const makeArrayExpressionAssignRule: AssignForValueRule<
    ArrayExpressionTypeClass,
    ArrayExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isArrayExpressionTypeClass),
    construct: (expressionTypeClass: ArrayExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const index = assignMultiClass(expressionTypeClass.getIndex(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            index,
        };
    },
};

export type Arth1ExpressionType = CommonType<'arth1Expression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '*' | '/';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth1ExpressionType = (value: unknown): value is Arth1ExpressionType => {
    return isCommonType(value) && value.type === 'arth1Expression';
};

export const makeArth1ExpressionAssignRule: AssignForValueRule<
    Arth1ExpressionTypeClass,
    Arth1ExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isArth1ExpressionTypeClass),
    construct: (expressionTypeClass: Arth1ExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type Arth2ExpressionType = CommonType<'arth2Expression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '+' | '-';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth2ExpressionType = (value: unknown): value is Arth2ExpressionType => {
    return isCommonType(value) && value.type === 'arth2Expression';
};

export const makeArth2ExpressionAssignRule: AssignForValueRule<
    Arth2ExpressionTypeClass,
    Arth2ExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isArth2ExpressionTypeClass),
    construct: (expressionTypeClass: Arth2ExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type AssignExpressionType = CommonType<'assignExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isAssignExpressionType = (value: unknown): value is AssignExpressionType => {
    return isCommonType(value) && value.type === 'assignExpression';
};

export const makeAssignExpressionAssignRule: AssignForValueRule<
    AssignExpressionTypeClass,
    AssignExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAssignExpressionTypeClass),
    construct: (expressionTypeClass: AssignExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator: expressionTypeClass.getOperator(),
            right,
        };
    },
};

export type BitAndExpressionType = CommonType<'bitAndExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '&';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitAndExpressionType = (value: unknown): value is BitAndExpressionType => {
    return isCommonType(value) && value.type === 'bitAndExpression';
};

export const makeBitAndExpressionAssignRule: AssignForValueRule<
    BitAndExpressionTypeClass,
    BitAndExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isBitAndExpressionTypeClass),
    construct: (expressionTypeClass: BitAndExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type BitExpressionType = CommonType<'bitExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: string;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitExpressionType = (value: unknown): value is BitExpressionType => {
    return isCommonType(value) && value.type === 'bitExpression';
};

export const makeBitExpressionAssignRule: AssignForValueRule<
    BitExpressionTypeClass,
    BitExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isBitExpressionTypeClass),
    construct: (expressionTypeClass: BitExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type BitNotExpressionType = CommonType<'bitNotExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '^';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitNotExpressionType = (value: unknown): value is BitNotExpressionType => {
    return isCommonType(value) && value.type === 'bitNotExpression';
};

export const makeBitNotExpressionAssignRule: AssignForValueRule<
    BitNotExpressionTypeClass,
    BitNotExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isBitNotExpressionTypeClass),
    construct: (expressionTypeClass: BitNotExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type BitOrExpressionType = CommonType<'bitOrExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '|';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitOrExpressionType = (value: unknown): value is BitOrExpressionType => {
    return isCommonType(value) && value.type === 'bitOrExpression';
};

export const makeBitOrExpressionAssignRule: AssignForValueRule<
    BitOrExpressionTypeClass,
    BitOrExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isBitOrExpressionTypeClass),
    construct: (expressionTypeClass: BitOrExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type BoundExpressionType = CommonType<'boundExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isBoundExpressionType = (value: unknown): value is BoundExpressionType => {
    return isCommonType(value) && value.type === 'boundExpression';
};

export const makeBoundExpressionAssignRule: AssignForValueRule<
    BoundExpressionTypeClass,
    BoundExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isBoundExpressionTypeClass),
    construct: (expressionTypeClass: BoundExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type CastExpressionType = CommonType<'castExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isCastExpressionType = (value: unknown): value is CastExpressionType => {
    return isCommonType(value) && value.type === 'castExpression';
};

export const makeCastExpressionAssignRule: AssignForValueRule<
    CastExpressionTypeClass,
    CastExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCastExpressionTypeClass),
    construct: (expressionTypeClass: CastExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const valueType = assignMultiClass(expressionTypeClass.getValueType(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            valueType,
        };
    },
};

export type CmpExpressionType = CommonType<'cmpExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: string;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCmpExpressionType = (value: unknown): value is CmpExpressionType => {
    return isCommonType(value) && value.type === 'cmpExpression';
};

export const makeCmpExpressionAssignRule: AssignForValueRule<
    CmpExpressionTypeClass,
    CmpExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCmpExpressionTypeClass),
    construct: (expressionTypeClass: CmpExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type CoalExpressionType = CommonType<'coalExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '??';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCoalExpressionType = (value: unknown): value is CoalExpressionType => {
    return isCommonType(value) && value.type === 'coalExpression';
};

export const makeCoalExpressionAssignRule: AssignForValueRule<
    CoalExpressionTypeClass,
    CoalExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCoalExpressionTypeClass),
    construct: (expressionTypeClass: CoalExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type CondExpressionType = CommonType<'condExpression'> & {
    condition: ValueRuleValue<BaseExpressionType>;
    trueValue: ValueRuleValue<BaseExpressionType>;
    falseValue: ValueRuleValue<BaseExpressionType>;
};

export const isCondExpressionType = (value: unknown): value is CondExpressionType => {
    return isCommonType(value) && value.type === 'condExpression';
};

export const makeCondExpressionAssignRule: AssignForValueRule<
    CondExpressionTypeClass,
    CondExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCondExpressionTypeClass),
    construct: (expressionTypeClass: CondExpressionTypeClass) => {
        const condition = assignMultiClass(expressionTypeClass.getCondition(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const trueValue = assignMultiClass(expressionTypeClass.getTrueValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const falseValue = assignMultiClass(expressionTypeClass.getFalseValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            condition,
            trueValue,
            falseValue,
        };
    },
};

export type ConditionalExpressionType = CommonType<'conditionalExpression'> & {
    value: ValueRuleValue<FieldExpressionType | LogicalExpressionType>;
};

export const isConditionalExpressionType = (value: unknown): value is ConditionalExpressionType => {
    return isCommonType(value) && value.type === 'conditionalExpression';
};

export const makeConditionalExpressionAssignRule: AssignForValueRule<
    ConditionalExpressionTypeClass,
    ConditionalExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isConditionalExpressionTypeClass),
    construct: (expressionTypeClass: ConditionalExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            makeFieldExpressionAssignRule,
            makeLogicalExpressionAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type DotExpressionType = CommonType<'dotExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '.' | '?.';
    right: ValueRuleValue<AnyIdType | DotMethodCallType>;
};

export const isDotExpressionType = (value: unknown): value is DotExpressionType => {
    return isCommonType(value) && value.type === 'dotExpression';
};

export const makeDotExpressionAssignRule: AssignForValueRule<
    DotExpressionTypeClass,
    DotExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDotExpressionTypeClass),
    construct: (expressiontypeClass: DotExpressionTypeClass) => {
        const left = assignMultiClass(expressiontypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressiontypeClass.getOperator();

        const right = assignMultiClass(expressiontypeClass.getRight(), [
            makeAnyIdAssignRule,
            makeDotMethodCallAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: expressiontypeClass.getType(),
            sourceInfo: makeSourceInfo(expressiontypeClass),
            left,
            operator,
            right,
        };
    },
};

export type EqualityExpressionType = CommonType<'equalityExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '===' | '!==' | '==' | '!=' | '<>';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isEqualityExpressionType = (value: unknown): value is EqualityExpressionType => {
    return isCommonType(value) && value.type === 'equalityExpression';
};

export const makeEqualityExpressionAssignRule: AssignForValueRule<
    EqualityExpressionTypeClass,
    EqualityExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isEqualityExpressionTypeClass),
    construct: (expressionTypeClass: EqualityExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type FieldExpressionType = CommonType<'fieldExpression'> & {
    left: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    operator: ValueRuleValue<ComparisonOperatorType>;
    right: ValueRuleValue<ValueType>;
};

export const isFieldExpressionType = (value: unknown): value is FieldExpressionType => {
    return isCommonType(value) && value.type === 'fieldExpression';
};

export const makeFieldExpressionAssignRule: AssignForValueRule<
    FieldExpressionTypeClass,
    FieldExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldExpressionTypeClass),
    construct: (expressionTypeClass: FieldExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            makeFieldNameAssignRule,
            makeSoqlFunctionAssignRule,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            makeValueAssignRule,
            makeErrorAssignRule,
        ]);
        const operator = assignMultiClass(expressionTypeClass.getOperator(), [
            makeComparisonOperatorAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type FilteringExpressionType = CommonType<'filteringExpression'> & {
    value: ValueRuleValue<DataCategorySelectionType>[];
};

export const isFilteringExpressionType = (value: unknown): value is FilteringExpressionType => {
    return isCommonType(value) && value.type === 'filteringExpression';
};

export const makeFilteringExpressionAssignRule: AssignForValueRule<
    FilteringExpressionTypeClass,
    FilteringExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFilteringExpressionTypeClass),
    construct: (expressionTypeClass: FilteringExpressionTypeClass) => {
        const value = expressionTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeDataCategorySelectionAssignRule, makeErrorAssignRule]),
            );
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type InstanceOfExpressionType = CommonType<'instanceOfExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: 'instanceof';
    right: ValueRuleValue<TypeRefType>;
};

export const isInstanceOfExpressionType = (value: unknown): value is InstanceOfExpressionType => {
    return isCommonType(value) && value.type === 'instanceOfExpression';
};

export const makeInstanceOfExpressionAssignRule: AssignForValueRule<
    InstanceOfExpressionTypeClass,
    InstanceOfExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isInstanceOfExpressionTypeClass),
    construct: (expressionTypeClass: InstanceOfExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type LogAndExpressionType = CommonType<'logAndExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '&&';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogAndExpressionType = (value: unknown): value is LogAndExpressionType => {
    return isCommonType(value) && value.type === 'logAndExpression';
};

export const makeLogAndExpressionAssignRule: AssignForValueRule<
    LogAndExpressionTypeClass,
    LogAndExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isLogAndExpressionTypeClass),
    construct: (expressionTypeClass: LogAndExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type LogicalExpressionType = CommonType<'logicalExpression'> & {
    value: ValueRuleValue<ConditionalExpressionType>[];
    operator: 'AND' | 'OR' | 'NOT' | null;
};

export const isLogicalExpressionType = (value: unknown): value is LogicalExpressionType => {
    return isCommonType(value) && value.type === 'logicalExpression';
};

export const makeLogicalExpressionAssignRule: AssignForValueRule<
    LogicalExpressionTypeClass,
    LogicalExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isLogicalExpressionTypeClass),
    construct: (expressionTypeClass: LogicalExpressionTypeClass) => {
        const value = expressionTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeConditionalExpressionAssignRule, makeErrorAssignRule]),
            );
        const operator = expressionTypeClass.getOperator();
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            operator,
        };
    },
};

export type LogOrExpressionType = CommonType<'logOrExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '||';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogOrExpressionType = (value: unknown): value is LogOrExpressionType => {
    return isCommonType(value) && value.type === 'logOrExpression';
};

export const makeLogOrExpressionAssignRule: AssignForValueRule<
    LogOrExpressionTypeClass,
    LogOrExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isLogOrExpressionTypeClass),
    construct: (expressionTypeClass: LogOrExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type MethodCallExpressionType = CommonType<'methodCallExpression'> & {
    value: ValueRuleValue<MethodCallType>;
};

export const isMethodCallExpressionType = (value: unknown): value is MethodCallExpressionType => {
    return isCommonType(value) && value.type === 'methodCallExpression';
};

export const makeMethodCallExpressionAssignRule: AssignForValueRule<
    MethodCallExpressionTypeClass,
    MethodCallExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallExpressionTypeClass),
    construct: (expressiontypeClass: MethodCallExpressionTypeClass) => {
        const value = assignMultiClass(expressiontypeClass.getValue(), [
            makeMethodCallAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: expressiontypeClass.getType(),
            sourceInfo: makeSourceInfo(expressiontypeClass),
            value,
        };
    },
};

export type NegExpressionType = CommonType<'negExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '~' | '!';
};

export const isNegExpressionType = (value: unknown): value is NegExpressionType => {
    return isCommonType(value) && value.type === 'negExpression';
};

export const makeNegExpressionAssignRule: AssignForValueRule<
    NegExpressionTypeClass,
    NegExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNegExpressionTypeClass),
    construct: (expressionTypeClass: NegExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            operator,
        };
    },
};

export type NewExpressionType = CommonType<'newExpression'> & {
    value: ValueRuleValue<CreatorType>;
};

export const isNewExpressionType = (value: unknown): value is NewExpressionType => {
    return isCommonType(value) && value.type === 'newExpression';
};

export const makeNewExpressionAssignRule: AssignForValueRule<
    NewExpressionTypeClass,
    NewExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNewExpressionTypeClass),
    construct: (expressionTypeClass: NewExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            makeCreatorAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type ExpressionType = CommonType<'expression'> & {
    value: string;
};

export const isExpressionType = (value: unknown): value is ExpressionType => {
    return isCommonType(value) && value.type === 'expression';
};

export const makeExpressionAssignRule: AssignForValueRule<
    NormalExpressionTypeClass,
    ExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalExpressionTypeClass),
    construct: (expressionTypeClass: NormalExpressionTypeClass) => {
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value: expressionTypeClass.getValue(),
        };
    },
};

export type ParExpressionType = CommonType<'parExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isParExpressionType = (value: unknown): value is ParExpressionType => {
    return isCommonType(value) && value.type === 'parExpression';
};

export const makeParExpressionAssignRule: AssignForValueRule<
    ParExpressionTypeClass,
    ParExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isParExpressionTypeClass),
    construct: (expressionTypeClass: ParExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type PostOpExpressionType = CommonType<'postOpExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '++' | '--';
};

export const isPostOpExpressionType = (value: unknown): value is PostOpExpressionType => {
    return isCommonType(value) && value.type === 'postOpExpression';
};

export const makePostOpExpressionAssignRule: AssignForValueRule<
    PostOpExpressionTypeClass,
    PostOpExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isPostOpExpressionTypeClass),
    construct: (expressionTypeClass: PostOpExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            operator,
        };
    },
};

export type PreOpExpressionType = CommonType<'preOpExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '++' | '--' | '+' | '-';
};

export const isPreOpExpressionType = (value: unknown): value is PreOpExpressionType => {
    return isCommonType(value) && value.type === 'preOpExpression';
};

export const makePreOpExpressionAssignRule: AssignForValueRule<
    PreOpExpressionTypeClass,
    PreOpExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isPreOpExpressionTypeClass),
    construct: (expressionTypeClass: PreOpExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const operator = expressionTypeClass.getOperator();

        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            operator,
        };
    },
};

export type PrimaryExpressionType = CommonType<'primaryExpression'> & {
    value: ValueRuleValue<BasePrimaryType>;
};

export const isPrimaryExpressionType = (value: unknown): value is PrimaryExpressionType => {
    return isCommonType(value) && value.type === 'primaryExpression';
};

export const makePrimaryExpressionAssignRule: AssignForValueRule<
    PrimaryExpressionTypeClass,
    PrimaryExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isPrimaryExpressionTypeClass),
    construct: (expressionTypeClass: PrimaryExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBasePrimaryAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type SubExpressionType = CommonType<'subExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isSubExpressionType = (value: unknown): value is SubExpressionType => {
    return isCommonType(value) && value.type === 'subExpression';
};

export const makeSubExpressionAssignRule: AssignForValueRule<
    SubExpressionTypeClass,
    SubExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSubExpressionTypeClass),
    construct: (expressionTypeClass: SubExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type WhereConditionalExpressionType = CommonType<'whereConditionalExpression'> & {
    value: ValueRuleValue<WhereFieldExpressionType | WhereLogicalExpressionType>;
};

export const isWhereConditionalExpressionType = (
    value: unknown,
): value is WhereConditionalExpressionType => {
    return isCommonType(value) && value.type === 'whereConditionalExpression';
};

export const makeWhereConditionalExpressionAssignRule: AssignForValueRule<
    WhereConditionalExpressionTypeClass,
    WhereConditionalExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWhereConditionalExpressionTypeClass),
    construct: (expressionTypeClass: WhereConditionalExpressionTypeClass) => {
        const value = assignMultiClass(expressionTypeClass.getValue(), [
            makeWhereFieldExpressionAssignRule,
            makeWhereLogicalExpressionAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
        };
    },
};

export type WhereFieldExpressionType = CommonType<'whereFieldExpression'> & {
    left: ValueRuleValue<string | FieldExpressionType>;
    operator: ValueRuleValue<ComparisonOperatorType | null>;
    right: ValueRuleValue<ValueType | null>;
};

export const isWhereFieldExpressionType = (value: unknown): value is WhereFieldExpressionType => {
    return isCommonType(value) && value.type === 'whereFieldExpression';
};

export const makeWhereFieldExpressionAssignRule: AssignForValueRule<
    WhereFieldExpressionTypeClass,
    WhereFieldExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWhereFieldExpressionTypeClass),
    construct: (expressionTypeClass: WhereFieldExpressionTypeClass) => {
        const left = assignMultiClass(expressionTypeClass.getLeft(), [
            makeStringAssignRule,
            makeFieldExpressionAssignRule,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(expressionTypeClass.getRight(), [
            makeValueAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const operator = assignMultiClass(expressionTypeClass.getOperator(), [
            makeComparisonOperatorAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            left,
            operator,
            right,
        };
    },
};

export type WhereLogicalExpressionType = CommonType<'whereLogicalExpression'> & {
    value: ValueRuleValue<WhereConditionalExpressionType>[];
    operator: 'AND' | 'OR' | 'NOT' | null;
};

export const isWhereLogicalExpressionType = (
    value: unknown,
): value is WhereLogicalExpressionType => {
    return isCommonType(value) && value.type === 'whereLogicalExpression';
};

export const makeWhereLogicalExpressionAssignRule: AssignForValueRule<
    WhereLogicalExpressionTypeClass,
    WhereLogicalExpressionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWhereLogicalExpressionTypeClass),
    construct: (expressionTypeClass: WhereLogicalExpressionTypeClass) => {
        const value = expressionTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [
                    makeWhereConditionalExpressionAssignRule,
                    makeErrorAssignRule,
                ]),
            );
        const operator = expressionTypeClass.getOperator();
        return {
            type: expressionTypeClass.getType(),
            sourceInfo: makeSourceInfo(expressionTypeClass),
            value,
            operator,
        };
    },
};

export type BaseExpressionType =
    | ExpressionType
    | PrimaryExpressionType
    | DotExpressionType
    | MethodCallExpressionType
    | NewExpressionType
    | CastExpressionType
    | SubExpressionType
    | ArrayExpressionType
    | Arth1ExpressionType
    | Arth2ExpressionType
    | AssignExpressionType
    | BitAndExpressionType
    | BitExpressionType
    | BitOrExpressionType
    | BitNotExpressionType
    | CmpExpressionType
    | CoalExpressionType
    | CondExpressionType
    | EqualityExpressionType
    | InstanceOfExpressionType
    | LogAndExpressionType
    | LogOrExpressionType
    | NegExpressionType
    | PostOpExpressionType
    | PreOpExpressionType;

export const makeBaseExpressionAssignRules = [
    makeExpressionAssignRule,
    makePrimaryExpressionAssignRule,
    makeDotExpressionAssignRule,
    makeMethodCallExpressionAssignRule,
    makeNewExpressionAssignRule,
    makeCastExpressionAssignRule,
    makeSubExpressionAssignRule,
    makeArrayExpressionAssignRule,
    makeArth1ExpressionAssignRule,
    makeArth2ExpressionAssignRule,
    makeAssignExpressionAssignRule,
    makeBitAndExpressionAssignRule,
    makeBitExpressionAssignRule,
    makeBitOrExpressionAssignRule,
    makeBitNotExpressionAssignRule,
    makeCmpExpressionAssignRule,
    makeCoalExpressionAssignRule,
    makeCondExpressionAssignRule,
    makeEqualityExpressionAssignRule,
    makeInstanceOfExpressionAssignRule,
    makeLogAndExpressionAssignRule,
    makeLogOrExpressionAssignRule,
    makeNegExpressionAssignRule,
    makePostOpExpressionAssignRule,
    makePreOpExpressionAssignRule,
] as const;
