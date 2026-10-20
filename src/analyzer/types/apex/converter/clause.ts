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

export type AllRowsClauseType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isAllRowsClauseType = typia.createIs<AllRowsClauseType>();

export const makeAllRowsClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AllRowsClauseTypeClass, AllRowsClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAllRowsClauseTypeClass),
        construct: (clauseTypeClass: AllRowsClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(clauseTypeClass));
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type CatchClauseType = {
    type: string;
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<QualifiedNameType>;
    block: ValueRuleValue<BlockType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isCatchClauseType = typia.createIs<CatchClauseType>();

export const makeCatchClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CatchClauseTypeClass, CatchClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCatchClauseTypeClass),
        construct: (clauseTypeClass: CatchClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = assignMultiClass(clauseTypeClass.getValueType(), [
                makeQualifiedNameRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const block = assignMultiClass(clauseTypeClass.getBlock(), [
                makeBlockRule(sourceField(node, 'block'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const modifierSource = sourceList(node, 'modifier');
            const modifier = clauseTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: clauseTypeClass.getType(), value, valueType, block, modifier };
        },
    };
};

export type DataCategorySelectionType = {
    type: string;
    value: ValueRuleValue<SoqlIdType>;
    selector: ValueRuleValue<FilteringSelectorType>;
    category: ValueRuleValue<DataCategoryNameType>;
};

export const isDataCategorySelectionType = typia.createIs<DataCategorySelectionType>();

export const makeDataCategorySelectionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DataCategorySelectionTypeClass, DataCategorySelectionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategorySelectionTypeClass),
        construct: (clauseTypeClass: DataCategorySelectionTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSoqlIdRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const selector = assignMultiClass(clauseTypeClass.getSelector(), [
                makeFilteringSelectorRule(sourceField(node, 'selector'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const category = assignMultiClass(clauseTypeClass.getCategory(), [
                makeDataCategoryNameRule(sourceField(node, 'category'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: clauseTypeClass.getType(), value, selector, category };
        },
    };
};

export type ElseClauseType = {
    type: string;
    value: ValueRuleValue<FieldNameListType>;
};

export const isElseClauseType = typia.createIs<ElseClauseType>();

export const makeElseClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElseClauseTypeClass, ElseClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElseClauseTypeClass),
        construct: (clauseTypeClass: ElseClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type FieldGroupByType = {
    type: string;
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
};

export const isFieldGroupByType = typia.createIs<FieldGroupByType>();

export const makeFieldGroupByRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldGroupByTypeClass, FieldGroupByType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByTypeClass),
        construct: (clauseTypeClass: FieldGroupByTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeSoqlFunctionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type FieldOrderType = {
    type: string;
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    direction: string | null;
    nulls: string | null;
};

export const isFieldOrderType = typia.createIs<FieldOrderType>();

export const makeFieldOrderRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldOrderTypeClass, FieldOrderType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderTypeClass),
        construct: (clauseTypeClass: FieldOrderTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeSoqlFunctionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const direction = clauseTypeClass.getDirection();
            const nulls = clauseTypeClass.getNulls();
            slot(node);
            return { type: clauseTypeClass.getType(), value, direction, nulls };
        },
    };
};

export type FilteringSelectorType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isFilteringSelectorType = typia.createIs<FilteringSelectorType>();

export const makeFilteringSelectorRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FilteringSelectorTypeClass, FilteringSelectorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFilteringSelectorTypeClass),
        construct: (clauseTypeClass: FilteringSelectorTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(clauseTypeClass));
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type ForClausesType = {
    type: string;
    value: ValueRuleValue<string>[];
};

export const isForClausesType = typia.createIs<ForClausesType>();

export const makeForClausesRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForClausesTypeClass, ForClausesType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForClausesTypeClass),
        construct: (clauseTypeClass: ForClausesTypeClass) => {
            const value = clauseTypeClass.getValue().map((v) =>
                assignMultiClass(v, [
                    {
                        isValid: (target: unknown): target is string => typeof target === 'string',
                        construct: (value: string) => value,
                    },
                    makeErrorAssignRule(errorInfo),
                ]),
            );
            slot(makeSourceNode(clauseTypeClass));
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type GroupByClauseType = {
    type: string;
    value: ValueRuleValue<FieldGroupByListType>;
    mode: string | null;
    having: ValueRuleValue<LogicalExpressionType>;
};

export const isGroupByClauseType = typia.createIs<GroupByClauseType>();

export const makeGroupByClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<GroupByClauseTypeClass, GroupByClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isGroupByClauseTypeClass),
        construct: (clauseTypeClass: GroupByClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldGroupByListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const mode = clauseTypeClass.getMode();

            const having = assignMultiClass(clauseTypeClass.getHaving(), [
                makeLogicalExpressionRule(sourceField(node, 'having'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: clauseTypeClass.getType(),
                value,
                mode,
                having,
            };
        },
    };
};

export type LimitClauseType = {
    type: string;
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isLimitClauseType = typia.createIs<LimitClauseType>();

export const makeLimitClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LimitClauseTypeClass, LimitClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLimitClauseTypeClass),
        construct: (clauseTypeClass: LimitClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeBoundExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type OffsetClauseType = {
    type: string;
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isOffsetClauseType = typia.createIs<OffsetClauseType>();

export const makeOffsetClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<OffsetClauseTypeClass, OffsetClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isOffsetClauseTypeClass),
        construct: (clauseTypeClass: OffsetClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeBoundExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type OrderByClauseType = {
    type: string;
    value: ValueRuleValue<FieldOrderListType>;
};

export const isOrderByClauseType = typia.createIs<OrderByClauseType>();

export const makeOrderByClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<OrderByClauseTypeClass, OrderByClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isOrderByClauseTypeClass),
        construct: (clauseTypeClass: OrderByClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldOrderListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type SoslClausesType = {
    type: string;
    value: ValueRuleValue<SearchGroupType>;
    fieldSpecList: ValueRuleValue<FieldSpecListType>;
    withList: ValueRuleValue<SoslWithClauseType>[] | null;
    limitClause: ValueRuleValue<LimitClauseType>;
    updateList: ValueRuleValue<UpdateListType>;
};

export const isSoslClausesType = typia.createIs<SoslClausesType>();

export const makeSoslClausesRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslClausesTypeClass, SoslClausesType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslClausesTypeClass),
        construct: (clauseTypeClass: SoslClausesTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSearchGroupRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const fieldSpecList = assignMultiClass(clauseTypeClass.getFieldSpecList(), [
                makeFieldSpecListRule(sourceField(node, 'fieldSpecList'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const withListValue = clauseTypeClass.getWithList();
            let withList = null;
            if (withListValue) {
                const withListSource = sourceList(node, 'withList');
                withList = withListValue.map((v, index) =>
                    assignMultiClass(v, [
                        makeSoslWithClauseRule(withListSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            } else {
                sourceField(node, 'withList');
            }

            const limitClause = assignMultiClass(clauseTypeClass.getLimitClause(), [
                makeLimitClauseRule(sourceField(node, 'limitClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const updateList = assignMultiClass(clauseTypeClass.getUpdateList(), [
                makeUpdateListRule(sourceField(node, 'updateList'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: clauseTypeClass.getType(),
                value,
                fieldSpecList,
                withList,
                limitClause,
                updateList,
            };
        },
    };
};

export type SoslWithClauseType = {
    type: string;
    value: ValueRuleValue<string>;
    content: ValueRuleValue<
        string | BoundExpressionType | FilteringExpressionType | NetworkListType
    >;
};

export const isSoslWithClauseType = typia.createIs<SoslWithClauseType>();

export const makeSoslWithClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslWithClauseTypeClass, SoslWithClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslWithClauseTypeClass),
        construct: (clauseTypeClass: SoslWithClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);

            const content = assignMultiClass(clauseTypeClass.getContent(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeBoundExpressionRule(sourceField(node, 'content'), errorInfo),
                makeFilteringExpressionRule(sourceField(node, 'content'), errorInfo),
                makeNetworkListRule(sourceField(node, 'content'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: clauseTypeClass.getType(),
                value,
                content,
            };
        },
    };
};

export type TypeOfType = {
    type: string;
    value: ValueRuleValue<FieldNameType>;
    whenClause: ValueRuleValue<WhenClauseType>[];
    elseClause: ValueRuleValue<ElseClauseType>;
};

export const isTypeOfType = typia.createIs<TypeOfType>();

export const makeTypeOfRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeOfTypeClass, TypeOfType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeOfTypeClass),
        construct: (clauseTypeClass: TypeOfTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);

            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const whenClauseSource = sourceList(node, 'whenClause');
            const whenClause = clauseTypeClass
                .getWhenClause()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeWhenClauseRule(whenClauseSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            const elseClause = assignMultiClass(clauseTypeClass.getElseClause(), [
                makeElseClauseRule(sourceField(node, 'elseClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: clauseTypeClass.getType(),
                value,
                whenClause,
                elseClause,
            };
        },
    };
};

export type UpdateTypeType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isUpdateTypeType = typia.createIs<UpdateTypeType>();

export const makeUpdateTypeRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateTypeTypeClass, UpdateTypeType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateTypeTypeClass),
        construct: (clauseTypeClass: UpdateTypeTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);

            slot(makeSourceNode(clauseTypeClass));
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type UsingScopeType = {
    type: string;
    value: ValueRuleValue<SoqlIdType>;
};

export const isUsingScopeType = typia.createIs<UsingScopeType>();

export const makeUsingScopeRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UsingScopeTypeClass, UsingScopeType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUsingScopeTypeClass),
        construct: (clauseTypeClass: UsingScopeTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSoqlIdRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type WhenClauseType = {
    type: string;
    value: ValueRuleValue<FieldNameType>;
    field: ValueRuleValue<FieldNameListType>;
};

export const isWhenClauseType = typia.createIs<WhenClauseType>();

export const makeWhenClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenClauseTypeClass, WhenClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenClauseTypeClass),
        construct: (clauseTypeClass: WhenClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);

            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const field = assignMultiClass(clauseTypeClass.getField(), [
                makeFieldNameListRule(sourceField(node, 'field'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: clauseTypeClass.getType(),
                value,
                field,
            };
        },
    };
};

export type WhereClauseType = {
    type: string;
    value: ValueRuleValue<WhereLogicalExpressionType>;
};

export const isWhereClauseType = typia.createIs<WhereClauseType>();

export const makeWhereClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereClauseTypeClass, WhereClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereClauseTypeClass),
        construct: (clauseTypeClass: WhereClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeWhereLogicalExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: clauseTypeClass.getType(), value };
        },
    };
};

export type WithClauseType = {
    type: string;
    value: ValueRuleValue<string | LogicalExpressionType>;
    field: ValueRuleValue<FilteringExpressionType>;
};

export const isWithClauseType = typia.createIs<WithClauseType>();

export const makeWithClauseRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WithClauseTypeClass, WithClauseType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWithClauseTypeClass),
        construct: (clauseTypeClass: WithClauseTypeClass) => {
            const node = makeSourceNode(clauseTypeClass);
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeLogicalExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const field = assignMultiClass(clauseTypeClass.getField(), [
                makeFilteringExpressionRule(sourceField(node, 'field'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: clauseTypeClass.getType(),
                value,
                field,
            };
        },
    };
};

