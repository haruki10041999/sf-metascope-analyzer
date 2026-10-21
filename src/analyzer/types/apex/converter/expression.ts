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
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeStringAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
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

export type ArrayExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    index: ValueRuleValue<BaseExpressionType>;
};

export const isArrayExpressionType = typia.createIs<ArrayExpressionType>();

export const makeArrayExpressionRule = (): AssignForValueRule<
    ArrayExpressionTypeClass,
    ArrayExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayExpressionTypeClass),
        construct: (expressionTypeClass: ArrayExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const index = assignMultiClass(expressionTypeClass.getIndex(), [
                ...makeBaseExpressionRule(),
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
};

export type Arth1ExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth1ExpressionType = typia.createIs<Arth1ExpressionType>();

export const makeArth1ExpressionRule = (): AssignForValueRule<
    Arth1ExpressionTypeClass,
    Arth1ExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArth1ExpressionTypeClass),
        construct: (expressionTypeClass: Arth1ExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type Arth2ExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth2ExpressionType = typia.createIs<Arth2ExpressionType>();

export const makeArth2ExpressionRule = (): AssignForValueRule<
    Arth2ExpressionTypeClass,
    Arth2ExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArth2ExpressionTypeClass),
        construct: (expressionTypeClass: Arth2ExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type AssignExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isAssignExpressionType = typia.createIs<AssignExpressionType>();

export const makeAssignExpressionRule = (): AssignForValueRule<
    AssignExpressionTypeClass,
    AssignExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAssignExpressionTypeClass),
        construct: (expressionTypeClass: AssignExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type BitAndExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitAndExpressionType = typia.createIs<BitAndExpressionType>();

export const makeBitAndExpressionRule = (): AssignForValueRule<
    BitAndExpressionTypeClass,
    BitAndExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitAndExpressionTypeClass),
        construct: (expressionTypeClass: BitAndExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type BitExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitExpressionType = typia.createIs<BitExpressionType>();

export const makeBitExpressionRule = (): AssignForValueRule<
    BitExpressionTypeClass,
    BitExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitExpressionTypeClass),
        construct: (expressionTypeClass: BitExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type BitNotExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitNotExpressionType = typia.createIs<BitNotExpressionType>();

export const makeBitNotExpressionRule = (): AssignForValueRule<
    BitNotExpressionTypeClass,
    BitNotExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitNotExpressionTypeClass),
        construct: (expressionTypeClass: BitNotExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type BitOrExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitOrExpressionType = typia.createIs<BitOrExpressionType>();

export const makeBitOrExpressionRule = (): AssignForValueRule<
    BitOrExpressionTypeClass,
    BitOrExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitOrExpressionTypeClass),
        construct: (expressionTypeClass: BitOrExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type BoundExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isBoundExpressionType = typia.createIs<BoundExpressionType>();

export const makeBoundExpressionRule = (): AssignForValueRule<
    BoundExpressionTypeClass,
    BoundExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBoundExpressionTypeClass),
        construct: (expressionTypeClass: BoundExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type CastExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isCastExpressionType = typia.createIs<CastExpressionType>();

export const makeCastExpressionRule = (): AssignForValueRule<
    CastExpressionTypeClass,
    CastExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCastExpressionTypeClass),
        construct: (expressionTypeClass: CastExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const valueType = assignMultiClass(expressionTypeClass.getValueType(), [
                makeTypeRefRule(),
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
};

export type CmpExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCmpExpressionType = typia.createIs<CmpExpressionType>();

export const makeCmpExpressionRule = (): AssignForValueRule<
    CmpExpressionTypeClass,
    CmpExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCmpExpressionTypeClass),
        construct: (expressionTypeClass: CmpExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type CoalExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCoalExpressionType = typia.createIs<CoalExpressionType>();

export const makeCoalExpressionRule = (): AssignForValueRule<
    CoalExpressionTypeClass,
    CoalExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCoalExpressionTypeClass),
        construct: (expressionTypeClass: CoalExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type CondExpressionType = CommonType & {
    condition: ValueRuleValue<BaseExpressionType>;
    trueValue: ValueRuleValue<BaseExpressionType>;
    falseValue: ValueRuleValue<BaseExpressionType>;
};

export const isCondExpressionType = typia.createIs<CondExpressionType>();

export const makeCondExpressionRule = (): AssignForValueRule<
    CondExpressionTypeClass,
    CondExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCondExpressionTypeClass),
        construct: (expressionTypeClass: CondExpressionTypeClass) => {
            const condition = assignMultiClass(expressionTypeClass.getCondition(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const trueValue = assignMultiClass(expressionTypeClass.getTrueValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const falseValue = assignMultiClass(expressionTypeClass.getFalseValue(), [
                ...makeBaseExpressionRule(),
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
};

export type ConditionalExpressionType = CommonType & {
    value: ValueRuleValue<FieldExpressionType | LogicalExpressionType>;
};

export const isConditionalExpressionType = typia.createIs<ConditionalExpressionType>();

export const makeConditionalExpressionRule = (): AssignForValueRule<
    ConditionalExpressionTypeClass,
    ConditionalExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isConditionalExpressionTypeClass),
        construct: (expressionTypeClass: ConditionalExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeFieldExpressionRule(),
                makeLogicalExpressionRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type DotExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<AnyIdType | DotMethodCallType>;
};

export const isDotExpressionType = typia.createIs<DotExpressionType>();

export const makeDotExpressionRule = (): AssignForValueRule<
    DotExpressionTypeClass,
    DotExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotExpressionTypeClass),
        construct: (expressiontypeClass: DotExpressionTypeClass) => {
            const left = assignMultiClass(expressiontypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressiontypeClass.getOperator(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressiontypeClass.getRight(), [
                makeAnyIdRule(),
                makeDotMethodCallRule(),
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
};

export type EqualityExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isEqualityExpressionType = typia.createIs<EqualityExpressionType>();

export const makeEqualityExpressionRule = (): AssignForValueRule<
    EqualityExpressionTypeClass,
    EqualityExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEqualityExpressionTypeClass),
        construct: (expressionTypeClass: EqualityExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type FieldExpressionType = CommonType & {
    left: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    operator: ValueRuleValue<ComparisonOperatorType>;
    right: ValueRuleValue<ValueType>;
};

export const isFieldExpressionType = typia.createIs<FieldExpressionType>();

export const makeFieldExpressionRule = (): AssignForValueRule<
    FieldExpressionTypeClass,
    FieldExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldExpressionTypeClass),
        construct: (expressionTypeClass: FieldExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                makeFieldNameRule(),
                makeSoqlFunctionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                makeValueRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeComparisonOperatorRule(),
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
};

export type FilteringExpressionType = CommonType & {
    value: ValueRuleValue<DataCategorySelectionType>[];
};

export const isFilteringExpressionType = typia.createIs<FilteringExpressionType>();

export const makeFilteringExpressionRule = (): AssignForValueRule<
    FilteringExpressionTypeClass,
    FilteringExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFilteringExpressionTypeClass),
        construct: (expressionTypeClass: FilteringExpressionTypeClass) => {
            const value = expressionTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [makeDataCategorySelectionRule(), makeErrorAssignRule]),
                );
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type InstanceOfExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<TypeRefType>;
};

export const isInstanceOfExpressionType = typia.createIs<InstanceOfExpressionType>();

export const makeInstanceOfExpressionRule = (): AssignForValueRule<
    InstanceOfExpressionTypeClass,
    InstanceOfExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInstanceOfExpressionTypeClass),
        construct: (expressionTypeClass: InstanceOfExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                makeTypeRefRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type LogAndExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogAndExpressionType = typia.createIs<LogAndExpressionType>();

export const makeLogAndExpressionRule = (): AssignForValueRule<
    LogAndExpressionTypeClass,
    LogAndExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogAndExpressionTypeClass),
        construct: (expressionTypeClass: LogAndExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type LogicalExpressionType = CommonType & {
    value: ValueRuleValue<ConditionalExpressionType>[];
    operator: string | null;
};

export const isLogicalExpressionType = typia.createIs<LogicalExpressionType>();

export const makeLogicalExpressionRule = (): AssignForValueRule<
    LogicalExpressionTypeClass,
    LogicalExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogicalExpressionTypeClass),
        construct: (expressionTypeClass: LogicalExpressionTypeClass) => {
            const value = expressionTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [makeConditionalExpressionRule(), makeErrorAssignRule]),
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
};

export type LogOrExpressionType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogOrExpressionType = typia.createIs<LogOrExpressionType>();

export const makeLogOrExpressionRule = (): AssignForValueRule<
    LogOrExpressionTypeClass,
    LogOrExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogOrExpressionTypeClass),
        construct: (expressionTypeClass: LogOrExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
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
};

export type MethodCallExpressionType = CommonType & {
    value: ValueRuleValue<MethodCallType>;
};

export const isMethodCallExpressionType = typia.createIs<MethodCallExpressionType>();

export const makeMethodCallExpressionRule = (): AssignForValueRule<
    MethodCallExpressionTypeClass,
    MethodCallExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallExpressionTypeClass),
        construct: (expressiontypeClass: MethodCallExpressionTypeClass) => {
            const value = assignMultiClass(expressiontypeClass.getValue(), [
                makeMethodCallRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressiontypeClass.getType(),
                sourceInfo: makeSourceInfo(expressiontypeClass),
                value,
            };
        },
    };
};

export type NegExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
};

export const isNegExpressionType = typia.createIs<NegExpressionType>();

export const makeNegExpressionRule = (): AssignForValueRule<
    NegExpressionTypeClass,
    NegExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNegExpressionTypeClass),
        construct: (expressionTypeClass: NegExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
                operator,
            };
        },
    };
};

export type NewExpressionType = CommonType & {
    value: ValueRuleValue<CreatorType>;
};

export const isNewExpressionType = typia.createIs<NewExpressionType>();

export const makeNewExpressionRule = (): AssignForValueRule<
    NewExpressionTypeClass,
    NewExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNewExpressionTypeClass),
        construct: (expressionTypeClass: NewExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeCreatorRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type ExpressionType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isExpressionType = typia.createIs<ExpressionType>();

export const makeExpressionRule = (): AssignForValueRule<
    NormalExpressionTypeClass,
    ExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalExpressionTypeClass),
        construct: (expressionTypeClass: NormalExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type ParExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isParExpressionType = typia.createIs<ParExpressionType>();

export const makeParExpressionRule = (): AssignForValueRule<
    ParExpressionTypeClass,
    ParExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isParExpressionTypeClass),
        construct: (expressionTypeClass: ParExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type PostOpExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
};

export const isPostOpExpressionType = typia.createIs<PostOpExpressionType>();

export const makePostOpExpressionRule = (): AssignForValueRule<
    PostOpExpressionTypeClass,
    PostOpExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPostOpExpressionTypeClass),
        construct: (expressionTypeClass: PostOpExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
                operator,
            };
        },
    };
};

export type PreOpExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: ValueRuleValue<string>;
};

export const isPreOpExpressionType = typia.createIs<PreOpExpressionType>();

export const makePreOpExpressionRule = (): AssignForValueRule<
    PreOpExpressionTypeClass,
    PreOpExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPreOpExpressionTypeClass),
        construct: (expressionTypeClass: PreOpExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
                operator,
            };
        },
    };
};

export type PrimaryExpressionType = CommonType & {
    value: ValueRuleValue<BasePrimaryType>;
};

export const isPrimaryExpressionType = typia.createIs<PrimaryExpressionType>();

export const makePrimaryExpressionRule = (): AssignForValueRule<
    PrimaryExpressionTypeClass,
    PrimaryExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPrimaryExpressionTypeClass),
        construct: (expressionTypeClass: PrimaryExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBasePrimaryRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type SubExpressionType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isSubExpressionType = typia.createIs<SubExpressionType>();

export const makeSubExpressionRule = (): AssignForValueRule<
    SubExpressionTypeClass,
    SubExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubExpressionTypeClass),
        construct: (expressionTypeClass: SubExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type WhereConditionalExpressionType = CommonType & {
    value: ValueRuleValue<WhereFieldExpressionType | WhereLogicalExpressionType>;
};

export const isWhereConditionalExpressionType = typia.createIs<WhereConditionalExpressionType>();

export const makeWhereConditionalExpressionRule = (): AssignForValueRule<
    WhereConditionalExpressionTypeClass,
    WhereConditionalExpressionType
> => {
    return {
        isValid: (target: unknown) =>
            isTargetTypeClass(target, isWhereConditionalExpressionTypeClass),
        construct: (expressionTypeClass: WhereConditionalExpressionTypeClass) => {
            const value = assignMultiClass(expressionTypeClass.getValue(), [
                makeWhereFieldExpressionRule(),
                makeWhereLogicalExpressionRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: expressionTypeClass.getType(),
                sourceInfo: makeSourceInfo(expressionTypeClass),
                value,
            };
        },
    };
};

export type WhereFieldExpressionType = CommonType & {
    left: ValueRuleValue<string | FieldExpressionType>;
    operator: ValueRuleValue<ComparisonOperatorType | null>;
    right: ValueRuleValue<ValueType | null>;
};

export const isWhereFieldExpressionType = typia.createIs<WhereFieldExpressionType>();

export const makeWhereFieldExpressionRule = (): AssignForValueRule<
    WhereFieldExpressionTypeClass,
    WhereFieldExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereFieldExpressionTypeClass),
        construct: (expressionTypeClass: WhereFieldExpressionTypeClass) => {
            const left = assignMultiClass(expressionTypeClass.getLeft(), [
                makeStringAssignRule,
                makeFieldExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(expressionTypeClass.getRight(), [
                makeValueRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            const operator = assignMultiClass(expressionTypeClass.getOperator(), [
                makeComparisonOperatorRule(),
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
};

export type WhereLogicalExpressionType = CommonType & {
    value: ValueRuleValue<WhereConditionalExpressionType>[];
    operator: string | null;
};

export const isWhereLogicalExpressionType = typia.createIs<WhereLogicalExpressionType>();

export const makeWhereLogicalExpressionRule = (): AssignForValueRule<
    WhereLogicalExpressionTypeClass,
    WhereLogicalExpressionType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereLogicalExpressionTypeClass),
        construct: (expressionTypeClass: WhereLogicalExpressionTypeClass) => {
            const value = expressionTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeWhereConditionalExpressionRule(),
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

export const makeBaseExpressionRule = () => {
    return [
        makeExpressionRule(),
        makePrimaryExpressionRule(),
        makeDotExpressionRule(),
        makeMethodCallExpressionRule(),
        makeNewExpressionRule(),
        makeCastExpressionRule(),
        makeSubExpressionRule(),
        makeArrayExpressionRule(),
        makeArth1ExpressionRule(),
        makeArth2ExpressionRule(),
        makeAssignExpressionRule(),
        makeBitAndExpressionRule(),
        makeBitExpressionRule(),
        makeBitOrExpressionRule(),
        makeBitNotExpressionRule(),
        makeCmpExpressionRule(),
        makeCoalExpressionRule(),
        makeCondExpressionRule(),
        makeEqualityExpressionRule(),
        makeInstanceOfExpressionRule(),
        makeLogAndExpressionRule(),
        makeLogOrExpressionRule(),
        makeNegExpressionRule(),
        makePostOpExpressionRule(),
        makePreOpExpressionRule(),
    ];
};

