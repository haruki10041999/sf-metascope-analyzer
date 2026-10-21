import typia from 'typia';

import {
    AllRowsClauseTypeClass,
    CatchClauseTypeClass,
    DataCategorySelectionTypeClass,
    ElseClauseTypeClass,
    FieldGroupByTypeClass,
    FieldOrderTypeClass,
    FilteringSelectorTypeClass,
    ForClausesTypeClass,
    GroupByClauseTypeClass,
    LimitClauseTypeClass,
    OffsetClauseTypeClass,
    OrderByClauseTypeClass,
    SoslClausesTypeClass,
    SoslWithClauseTypeClass,
    TypeOfTypeClass,
    UpdateTypeTypeClass,
    UsingScopeTypeClass,
    WhenClauseTypeClass,
    WhereClauseTypeClass,
    WithClauseTypeClass,
    isAllRowsClauseType as isAllRowsClauseTypeClass,
    isCatchClauseType as isCatchClauseTypeClass,
    isDataCategorySelectionType as isDataCategorySelectionTypeClass,
    isElseClauseType as isElseClauseTypeClass,
    isFieldGroupByType as isFieldGroupByTypeClass,
    isFieldOrderType as isFieldOrderTypeClass,
    isFilteringSelectorType as isFilteringSelectorTypeClass,
    isForClausesType as isForClausesTypeClass,
    isGroupByClauseType as isGroupByClauseTypeClass,
    isLimitClauseType as isLimitClauseTypeClass,
    isOffsetClauseType as isOffsetClauseTypeClass,
    isOrderByClauseType as isOrderByClauseTypeClass,
    isSoslClausesType as isSoslClausesTypeClass,
    isSoslWithClauseType as isSoslWithClauseTypeClass,
    isTypeOfType as isTypeOfTypeClass,
    isUpdateTypeType as isUpdateTypeTypeClass,
    isUsingScopeType as isUsingScopeTypeClass,
    isWhenClauseType as isWhenClauseTypeClass,
    isWhereClauseType as isWhereClauseTypeClass,
    isWithClauseType as isWithClauseTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeIdRule, makeSoqlIdRule, IdType, SoqlIdType } from './id';
import {
    makeQualifiedNameRule,
    makeDataCategoryNameRule,
    makeFieldNameRule,
    QualifiedNameType,
    DataCategoryNameType,
    FieldNameType,
} from './name';
import { makeBlockRule, BlockType } from './block';
import { makeModifierRule, ModifierType } from './modifier';
import {
    makeFieldGroupByListRule,
    makeFieldNameListRule,
    makeFieldOrderListRule,
    makeFieldSpecListRule,
    makeNetworkListRule,
    makeUpdateListRule,
    FieldGroupByListType,
    FieldNameListType,
    FieldOrderListType,
    FieldSpecListType,
    NetworkListType,
    UpdateListType,
} from './list';
import {
    makeSoqlFunctionRule,
    makeSearchGroupRule,
    SoqlFunctionType,
    SearchGroupType,
} from './query';
import {
    makeBoundExpressionRule,
    makeLogicalExpressionRule,
    makeFilteringExpressionRule,
    makeWhereLogicalExpressionRule,
    BoundExpressionType,
    LogicalExpressionType,
    FilteringExpressionType,
    WhereLogicalExpressionType,
} from './expression';

export type AllRowsClauseType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isAllRowsClauseType = typia.createIs<AllRowsClauseType>();

export const makeAllRowsClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<AllRowsClauseTypeClass, AllRowsClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAllRowsClauseTypeClass),
        construct: (clauseTypeClass: AllRowsClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type CatchClauseType = CommonType & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<QualifiedNameType>;
    block: ValueRuleValue<BlockType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isCatchClauseType = typia.createIs<CatchClauseType>();

export const makeCatchClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<CatchClauseTypeClass, CatchClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCatchClauseTypeClass),
        construct: (clauseTypeClass: CatchClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(clauseTypeClass.getValueType(), [
                makeQualifiedNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const block = assignMultiClass(clauseTypeClass.getBlock(), [
                makeBlockRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const modifier = clauseTypeClass
                .getModifier()
                .map((v) =>
                    assignMultiClass(v, [
                        makeModifierRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                valueType,
                block,
                modifier,
            };
        },
    };
};

export type DataCategorySelectionType = CommonType & {
    value: ValueRuleValue<SoqlIdType>;
    selector: ValueRuleValue<FilteringSelectorType>;
    category: ValueRuleValue<DataCategoryNameType>;
};

export const isDataCategorySelectionType = typia.createIs<DataCategorySelectionType>();

export const makeDataCategorySelectionRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DataCategorySelectionTypeClass, DataCategorySelectionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategorySelectionTypeClass),
        construct: (clauseTypeClass: DataCategorySelectionTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSoqlIdRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const selector = assignMultiClass(clauseTypeClass.getSelector(), [
                makeFilteringSelectorRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const category = assignMultiClass(clauseTypeClass.getCategory(), [
                makeDataCategoryNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                selector,
                category,
            };
        },
    };
};

export type ElseClauseType = CommonType & {
    value: ValueRuleValue<FieldNameListType>;
};

export const isElseClauseType = typia.createIs<ElseClauseType>();

export const makeElseClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElseClauseTypeClass, ElseClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElseClauseTypeClass),
        construct: (clauseTypeClass: ElseClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type FieldGroupByType = CommonType & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
};

export const isFieldGroupByType = typia.createIs<FieldGroupByType>();

export const makeFieldGroupByRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldGroupByTypeClass, FieldGroupByType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByTypeClass),
        construct: (clauseTypeClass: FieldGroupByTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeSoqlFunctionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type FieldOrderType = CommonType & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    direction: string | null;
    nulls: string | null;
};

export const isFieldOrderType = typia.createIs<FieldOrderType>();

export const makeFieldOrderRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldOrderTypeClass, FieldOrderType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderTypeClass),
        construct: (clauseTypeClass: FieldOrderTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeSoqlFunctionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const direction = clauseTypeClass.getDirection();
            const nulls = clauseTypeClass.getNulls();
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                direction,
                nulls,
            };
        },
    };
};

export type FilteringSelectorType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isFilteringSelectorType = typia.createIs<FilteringSelectorType>();

export const makeFilteringSelectorRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FilteringSelectorTypeClass, FilteringSelectorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFilteringSelectorTypeClass),
        construct: (clauseTypeClass: FilteringSelectorTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type ForClausesType = CommonType & {
    value: ValueRuleValue<string>[];
};

export const isForClausesType = typia.createIs<ForClausesType>();

export const makeForClausesRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForClausesTypeClass, ForClausesType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForClausesTypeClass),
        construct: (clauseTypeClass: ForClausesTypeClass) => {
            const value = clauseTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [makeStringAssignRule, makeErrorAssignRule(errorInfo)]),
                );
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type GroupByClauseType = CommonType & {
    value: ValueRuleValue<FieldGroupByListType>;
    mode: string | null;
    having: ValueRuleValue<LogicalExpressionType | null>;
};

export const isGroupByClauseType = typia.createIs<GroupByClauseType>();

export const makeGroupByClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<GroupByClauseTypeClass, GroupByClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isGroupByClauseTypeClass),
        construct: (clauseTypeClass: GroupByClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldGroupByListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const mode = clauseTypeClass.getMode();

            const having = assignMultiClass(clauseTypeClass.getHaving(), [
                makeLogicalExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                mode,
                having,
            };
        },
    };
};

export type LimitClauseType = CommonType & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isLimitClauseType = typia.createIs<LimitClauseType>();

export const makeLimitClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<LimitClauseTypeClass, LimitClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLimitClauseTypeClass),
        construct: (clauseTypeClass: LimitClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeBoundExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type OffsetClauseType = CommonType & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isOffsetClauseType = typia.createIs<OffsetClauseType>();

export const makeOffsetClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<OffsetClauseTypeClass, OffsetClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isOffsetClauseTypeClass),
        construct: (clauseTypeClass: OffsetClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeBoundExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type OrderByClauseType = CommonType & {
    value: ValueRuleValue<FieldOrderListType>;
};

export const isOrderByClauseType = typia.createIs<OrderByClauseType>();

export const makeOrderByClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<OrderByClauseTypeClass, OrderByClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isOrderByClauseTypeClass),
        construct: (clauseTypeClass: OrderByClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldOrderListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type SoslClausesType = CommonType & {
    value: ValueRuleValue<SearchGroupType | null>;
    fieldSpecList: ValueRuleValue<FieldSpecListType | null>;
    withList: ValueRuleValue<SoslWithClauseType>[] | null;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export const isSoslClausesType = typia.createIs<SoslClausesType>();

export const makeSoslClausesRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslClausesTypeClass, SoslClausesType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslClausesTypeClass),
        construct: (clauseTypeClass: SoslClausesTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSearchGroupRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            const fieldSpecList = assignMultiClass(clauseTypeClass.getFieldSpecList(), [
                makeFieldSpecListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            const withListValue = clauseTypeClass.getWithList();
            let withList = null;
            if (withListValue) {
                withList = withListValue.map((v) =>
                    assignMultiClass(v, [
                        makeSoslWithClauseRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            }

            const limitClause = assignMultiClass(clauseTypeClass.getLimitClause(), [
                makeLimitClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            const updateList = assignMultiClass(clauseTypeClass.getUpdateList(), [
                makeUpdateListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                fieldSpecList,
                withList,
                limitClause,
                updateList,
            };
        },
    };
};

export type SoslWithClauseType = CommonType & {
    value: ValueRuleValue<string>;
    content: ValueRuleValue<
        string | BoundExpressionType | FilteringExpressionType | NetworkListType | null
    >;
};

export const isSoslWithClauseType = typia.createIs<SoslWithClauseType>();

export const makeSoslWithClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslWithClauseTypeClass, SoslWithClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslWithClauseTypeClass),
        construct: (clauseTypeClass: SoslWithClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);

            const content = assignMultiClass(clauseTypeClass.getContent(), [
                makeStringAssignRule,
                makeBoundExpressionRule(errorInfo),
                makeFilteringExpressionRule(errorInfo),
                makeNetworkListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                content,
            };
        },
    };
};

export type TypeOfType = CommonType & {
    value: ValueRuleValue<FieldNameType>;
    whenClause: ValueRuleValue<WhenClauseType>[];
    elseClause: ValueRuleValue<ElseClauseType | null>;
};

export const isTypeOfType = typia.createIs<TypeOfType>();

export const makeTypeOfRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeOfTypeClass, TypeOfType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeOfTypeClass),
        construct: (clauseTypeClass: TypeOfTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const whenClause = clauseTypeClass
                .getWhenClause()
                .map((v) =>
                    assignMultiClass(v, [
                        makeWhenClauseRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            const elseClause = assignMultiClass(clauseTypeClass.getElseClause(), [
                makeElseClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                whenClause,
                elseClause,
            };
        },
    };
};

export type UpdateTypeType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isUpdateTypeType = typia.createIs<UpdateTypeType>();

export const makeUpdateTypeRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateTypeTypeClass, UpdateTypeType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateTypeTypeClass),
        construct: (clauseTypeClass: UpdateTypeTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type UsingScopeType = CommonType & {
    value: ValueRuleValue<SoqlIdType>;
};

export const isUsingScopeType = typia.createIs<UsingScopeType>();

export const makeUsingScopeRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<UsingScopeTypeClass, UsingScopeType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUsingScopeTypeClass),
        construct: (clauseTypeClass: UsingScopeTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSoqlIdRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type WhenClauseType = CommonType & {
    value: ValueRuleValue<FieldNameType>;
    field: ValueRuleValue<FieldNameListType>;
};

export const isWhenClauseType = typia.createIs<WhenClauseType>();

export const makeWhenClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenClauseTypeClass, WhenClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenClauseTypeClass),
        construct: (clauseTypeClass: WhenClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const field = assignMultiClass(clauseTypeClass.getField(), [
                makeFieldNameListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                field,
            };
        },
    };
};

export type WhereClauseType = CommonType & {
    value: ValueRuleValue<WhereLogicalExpressionType>;
};

export const isWhereClauseType = typia.createIs<WhereClauseType>();

export const makeWhereClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereClauseTypeClass, WhereClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereClauseTypeClass),
        construct: (clauseTypeClass: WhereClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeWhereLogicalExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };
};

export type WithClauseType = CommonType & {
    value: ValueRuleValue<string | LogicalExpressionType>;
    field: ValueRuleValue<FilteringExpressionType | null>;
};

export const isWithClauseType = typia.createIs<WithClauseType>();

export const makeWithClauseRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<WithClauseTypeClass, WithClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWithClauseTypeClass),
        construct: (clauseTypeClass: WithClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeLogicalExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const field = assignMultiClass(clauseTypeClass.getField(), [
                makeFilteringExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                field,
            };
        },
    };
};

