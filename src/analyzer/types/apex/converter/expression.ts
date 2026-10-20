import typia from 'typia';

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
    ErrorInfo,
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
    sourceList,
} from './commons';
import { makeAnyIdRule, AnyIdType } from './id';
import { makeBasePrimaryRule, BasePrimaryType } from './primary';
import { makeFieldNameRule, FieldNameType } from './name';
import {
    makeSoqlFunctionRule,
    makeComparisonOperatorRule,
    SoqlFunctionType,
    ComparisonOperatorType,
} from './query';
import { makeValueRule, ValueType } from './value';
import { makeDataCategorySelectionRule, DataCategorySelectionType } from './clause';
import { makeCreatorRule, CreatorType } from './rest';
import { makeTypeRefRule, TypeRefType } from './type';
import {
    makeDotMethodCallRule,
    makeMethodCallRule,
    MethodCallType,
    DotMethodCallType,
} from './call';

export type ArrayExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    index: ValueRuleValue<BaseExpressionType>;
};

export const isArrayExpressionType = typia.createIs<ArrayExpressionType>();

export const makeArrayExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayExpressionTypeClass, ArrayExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayExpressionTypeClass),
        construct: (expressionTypeClass: ArrayExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const index = assignMultiClass(expressionTypeClass.getIndex(), [
                ...makeBaseExpressionRule(sourceField(node, 'index'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value, index };
        },
    };
};

export type Arth1ExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth1ExpressionType = typia.createIs<Arth1ExpressionType>();

export const makeArth1ExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<Arth1ExpressionTypeClass, Arth1ExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArth1ExpressionTypeClass),
        construct: (expressionTypeClass: Arth1ExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type Arth2ExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth2ExpressionType = typia.createIs<Arth2ExpressionType>();

export const makeArth2ExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<Arth2ExpressionTypeClass, Arth2ExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArth2ExpressionTypeClass),
        construct: (expressionTypeClass: Arth2ExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type AssignExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isAssignExpressionType = typia.createIs<AssignExpressionType>();

export const makeAssignExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AssignExpressionTypeClass, AssignExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAssignExpressionTypeClass),
        construct: (expressionTypeClass: AssignExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type BitAndExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitAndExpressionType = typia.createIs<BitAndExpressionType>();

export const makeBitAndExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitAndExpressionTypeClass, BitAndExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitAndExpressionTypeClass),
        construct: (expressionTypeClass: BitAndExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type BitExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitExpressionType = typia.createIs<BitExpressionType>();

export const makeBitExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitExpressionTypeClass, BitExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitExpressionTypeClass),
        construct: (expressionTypeClass: BitExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type BitNotExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitNotExpressionType = typia.createIs<BitNotExpressionType>();

export const makeBitNotExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitNotExpressionTypeClass, BitNotExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitNotExpressionTypeClass),
        construct: (expressionTypeClass: BitNotExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type BitOrExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitOrExpressionType = typia.createIs<BitOrExpressionType>();

export const makeBitOrExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitOrExpressionTypeClass, BitOrExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitOrExpressionTypeClass),
        construct: (expressionTypeClass: BitOrExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type BoundExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
};

export const isBoundExpressionType = typia.createIs<BoundExpressionType>();

export const makeBoundExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BoundExpressionTypeClass, BoundExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBoundExpressionTypeClass),
        construct: (expressionTypeClass: BoundExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type CastExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isCastExpressionType = typia.createIs<CastExpressionType>();

export const makeCastExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CastExpressionTypeClass, CastExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCastExpressionTypeClass),
        construct: (expressionTypeClass: CastExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = assignMultiClass(expressionTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: expressionTypeClass.getType(), value, valueType };
        },
    };
};

export type CmpExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCmpExpressionType = typia.createIs<CmpExpressionType>();

export const makeCmpExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CmpExpressionTypeClass, CmpExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCmpExpressionTypeClass),
        construct: (expressionTypeClass: CmpExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type CoalExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCoalExpressionType = typia.createIs<CoalExpressionType>();

export const makeCoalExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CoalExpressionTypeClass, CoalExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCoalExpressionTypeClass),
        construct: (expressionTypeClass: CoalExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type CondExpressionType = {
    type: string;
    condition: ValueRuleValue<BaseExpressionType>;
    trueValue: ValueRuleValue<BaseExpressionType>;
    falseValue: ValueRuleValue<BaseExpressionType>;
};

export const isCondExpressionType = typia.createIs<CondExpressionType>();

export const makeCondExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CondExpressionTypeClass, CondExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCondExpressionTypeClass),
        construct: (expressionTypeClass: CondExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const condition = assignMultiClass(expressionTypeClass.getCondition(), [
                ...makeBaseExpressionRule(sourceField(node, 'condition'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const trueValue = assignMultiClass(expressionTypeClass.getTrueValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'trueValue'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const falseValue = assignMultiClass(expressionTypeClass.getFalseValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'falseValue'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: expressionTypeClass.getType(), condition, trueValue, falseValue };
        },
    };
};

export type ConditionalExpressionType = {
    type: string;
    value: ValueRuleValue<FieldExpressionType | LogicalExpressionType>;
};

export const isConditionalExpressionType = typia.createIs<ConditionalExpressionType>();

export const makeConditionalExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ConditionalExpressionTypeClass, ConditionalExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isConditionalExpressionTypeClass),
        construct: (expressionTypeClass: ConditionalExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeFieldExpressionRule(sourceField(node, 'value'), errorInfo),
                makeLogicalExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type DotExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<AnyIdType | DotMethodCallType>;
};

export const isDotExpressionType = typia.createIs<DotExpressionType>();

export const makeDotExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DotExpressionTypeClass, DotExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotExpressionTypeClass),
        construct: (expressiontypeClass: DotExpressionTypeClass) => {
            const node = makeSourceNode(expressiontypeClass);
            const left = assignMultiClass(expressiontypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressiontypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressiontypeClass.getRight(), [
                makeAnyIdRule(sourceField(node, 'right')),
                makeDotMethodCallRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressiontypeClass.getType(), left, operator, right };
        },
    };
};

export type EqualityExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isEqualityExpressionType = typia.createIs<EqualityExpressionType>();

export const makeEqualityExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<EqualityExpressionTypeClass, EqualityExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEqualityExpressionTypeClass),
        construct: (expressionTypeClass: EqualityExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type FieldExpressionType = {
    type: string;
    left: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    operator: ValueRuleValue<ComparisonOperatorType>;
    right: ValueRuleValue<ValueType>;
};

export const isFieldExpressionType = typia.createIs<FieldExpressionType>();

export const makeFieldExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldExpressionTypeClass, FieldExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldExpressionTypeClass),
        construct: (expressionTypeClass: FieldExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                makeFieldNameRule(sourceField(node, 'left'), errorInfo),
                makeSoqlFunctionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                makeValueRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeComparisonOperatorRule(sourceField(node, 'operator'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type FilteringExpressionType = {
    type: string;
    value: ValueRuleValue<DataCategorySelectionType>[];
};

export const isFilteringExpressionType = typia.createIs<FilteringExpressionType>();

export const makeFilteringExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FilteringExpressionTypeClass, FilteringExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFilteringExpressionTypeClass),
        construct: (expressionTypeClass: FilteringExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = expressionTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeDataCategorySelectionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type InstanceOfExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<TypeRefType>;
};

export const isInstanceOfExpressionType = typia.createIs<InstanceOfExpressionType>();

export const makeInstanceOfExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InstanceOfExpressionTypeClass, InstanceOfExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInstanceOfExpressionTypeClass),
        construct: (expressionTypeClass: InstanceOfExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                makeTypeRefRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type LogAndExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogAndExpressionType = typia.createIs<LogAndExpressionType>();

export const makeLogAndExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LogAndExpressionTypeClass, LogAndExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogAndExpressionTypeClass),
        construct: (expressionTypeClass: LogAndExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type LogicalExpressionType = {
    type: string;
    value: ValueRuleValue<ConditionalExpressionType>[];
    operator: string | null;
};

export const isLogicalExpressionType = typia.createIs<LogicalExpressionType>();

export const makeLogicalExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LogicalExpressionTypeClass, LogicalExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogicalExpressionTypeClass),
        construct: (expressionTypeClass: LogicalExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = expressionTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeConditionalExpressionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const operator = expressionTypeClass.getOperator();
            slot(node);
            return { type: expressionTypeClass.getType(), value, operator };
        },
    };
};

export type LogOrExpressionType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogOrExpressionType = typia.createIs<LogOrExpressionType>();

export const makeLogOrExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LogOrExpressionTypeClass, LogOrExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogOrExpressionTypeClass),
        construct: (expressionTypeClass: LogOrExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type MethodCallExpressionType = {
    type: string;
    value: ValueRuleValue<MethodCallType>;
};

export const isMethodCallExpressionType = typia.createIs<MethodCallExpressionType>();

export const makeMethodCallExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MethodCallExpressionTypeClass, MethodCallExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallExpressionTypeClass),
        construct: (expressiontypeClass: MethodCallExpressionTypeClass) => {
            const node = makeSourceNode(expressiontypeClass);
            const value = assignMultiClass(expressiontypeClass.getValue(), [
                makeMethodCallRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressiontypeClass.getType(), value };
        },
    };
};

export type NegExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
};

export const isNegExpressionType = typia.createIs<NegExpressionType>();

export const makeNegExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NegExpressionTypeClass, NegExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNegExpressionTypeClass),
        construct: (expressionTypeClass: NegExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value, operator };
        },
    };
};

export type NewExpressionType = {
    type: string;
    value: ValueRuleValue<CreatorType>;
};

export const isNewExpressionType = typia.createIs<NewExpressionType>();

export const makeNewExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NewExpressionTypeClass, NewExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNewExpressionTypeClass),
        construct: (expressionTypeClass: NewExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeCreatorRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type ExpressionType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isExpressionType = typia.createIs<ExpressionType>();

export const makeExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalExpressionTypeClass, ExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalExpressionTypeClass),
        construct: (expressionTypeClass: NormalExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(expressionTypeClass));
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type ParExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
};

export const isParExpressionType = typia.createIs<ParExpressionType>();

export const makeParExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ParExpressionTypeClass, ParExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isParExpressionTypeClass),
        construct: (expressionTypeClass: ParExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type PostOpExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
};

export const isPostOpExpressionType = typia.createIs<PostOpExpressionType>();

export const makePostOpExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PostOpExpressionTypeClass, PostOpExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPostOpExpressionTypeClass),
        construct: (expressionTypeClass: PostOpExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value, operator };
        },
    };
};

export type PreOpExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
};

export const isPreOpExpressionType = typia.createIs<PreOpExpressionType>();

export const makePreOpExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PreOpExpressionTypeClass, PreOpExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPreOpExpressionTypeClass),
        construct: (expressionTypeClass: PreOpExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value, operator };
        },
    };
};

export type PrimaryExpressionType = {
    type: string;
    value: ValueRuleValue<BasePrimaryType>;
};

export const isPrimaryExpressionType = typia.createIs<PrimaryExpressionType>();

export const makePrimaryExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PrimaryExpressionTypeClass, PrimaryExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPrimaryExpressionTypeClass),
        construct: (expressionTypeClass: PrimaryExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBasePrimaryRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type SubExpressionType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>;
};

export const isSubExpressionType = typia.createIs<SubExpressionType>();

export const makeSubExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubExpressionTypeClass, SubExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubExpressionTypeClass),
        construct: (expressionTypeClass: SubExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type WhereConditionalExpressionType = {
    type: string;
    value: ValueRuleValue<WhereFieldExpressionType | WhereLogicalExpressionType>;
};

export const isWhereConditionalExpressionType = typia.createIs<WhereConditionalExpressionType>();

export const makeWhereConditionalExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereConditionalExpressionTypeClass, WhereConditionalExpressionType> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isWhereConditionalExpressionTypeClass),
        construct: (expressionTypeClass: WhereConditionalExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeWhereFieldExpressionRule(sourceField(node, 'value'), errorInfo),
                makeWhereLogicalExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), value };
        },
    };
};

export type WhereFieldExpressionType = {
    type: string;
    left: ValueRuleValue<string | FieldExpressionType>;
    operator: ValueRuleValue<ComparisonOperatorType>;
    right: ValueRuleValue<ValueType>;
};

export const isWhereFieldExpressionType = typia.createIs<WhereFieldExpressionType>();

export const makeWhereFieldExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereFieldExpressionTypeClass, WhereFieldExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereFieldExpressionTypeClass),
        construct: (expressionTypeClass: WhereFieldExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeFieldExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                makeValueRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeComparisonOperatorRule(sourceField(node, 'operator'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: expressionTypeClass.getType(), left, operator, right };
        },
    };
};

export type WhereLogicalExpressionType = {
    type: string;
    value: ValueRuleValue<WhereConditionalExpressionType>[];
    operator: string | null;
};

export const isWhereLogicalExpressionType = typia.createIs<WhereLogicalExpressionType>();

export const makeWhereLogicalExpressionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereLogicalExpressionTypeClass, WhereLogicalExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereLogicalExpressionTypeClass),
        construct: (expressionTypeClass: WhereLogicalExpressionTypeClass) => {
            const node = makeSourceNode(expressionTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = expressionTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeWhereConditionalExpressionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            const operator = expressionTypeClass.getOperator();
            slot(node);
            return { type: expressionTypeClass.getType(), value, operator };
        },
    };
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

export const makeBaseExpressionRule = (slot: SourceSlot, errorInfo: ErrorInfo[]) => {
    return [
        makeExpressionRule(slot, errorInfo),
        makePrimaryExpressionRule(slot, errorInfo),
        makeDotExpressionRule(slot, errorInfo),
        makeMethodCallExpressionRule(slot, errorInfo),
        makeNewExpressionRule(slot, errorInfo),
        makeCastExpressionRule(slot, errorInfo),
        makeSubExpressionRule(slot, errorInfo),
        makeArrayExpressionRule(slot, errorInfo),
        makeArth1ExpressionRule(slot, errorInfo),
        makeArth2ExpressionRule(slot, errorInfo),
        makeAssignExpressionRule(slot, errorInfo),
        makeBitAndExpressionRule(slot, errorInfo),
        makeBitExpressionRule(slot, errorInfo),
        makeBitOrExpressionRule(slot, errorInfo),
        makeBitNotExpressionRule(slot, errorInfo),
        makeCmpExpressionRule(slot, errorInfo),
        makeCoalExpressionRule(slot, errorInfo),
        makeCondExpressionRule(slot, errorInfo),
        makeEqualityExpressionRule(slot, errorInfo),
        makeInstanceOfExpressionRule(slot, errorInfo),
        makeLogAndExpressionRule(slot, errorInfo),
        makeLogOrExpressionRule(slot, errorInfo),
        makeNegExpressionRule(slot, errorInfo),
        makePostOpExpressionRule(slot, errorInfo),
        makePreOpExpressionRule(slot, errorInfo),
    ];
};

