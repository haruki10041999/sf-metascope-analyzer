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
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeStringAssignRule,
    makeSourceInfo,
    makeLimitedStringAssignRule,
} from './commons';
import { makeIdAssignRule, makeSoqlIdAssignRule, IdType, SoqlIdType } from './id';
import {
    makeQualifiedNameAssignRule,
    makeDataCategoryNameAssignRule,
    makeFieldNameAssignRule,
    QualifiedNameType,
    DataCategoryNameType,
    FieldNameType,
} from './name';
import { makeBlockAssignRule, BlockType } from './block';
import { makeModifierAssignRule, ModifierType } from './modifier';
import {
    makeFieldGroupByListAssignRule,
    makeFieldNameListAssignRule,
    makeFieldOrderListAssignRule,
    makeFieldSpecListAssignRule,
    makeNetworkListAssignRule,
    makeUpdateListAssignRule,
    FieldGroupByListType,
    FieldNameListType,
    FieldOrderListType,
    FieldSpecListType,
    NetworkListType,
    UpdateListType,
} from './list';
import {
    makeSoqlFunctionAssignRule,
    makeSearchGroupAssignRule,
    SoqlFunctionType,
    SearchGroupType,
} from './query';
import {
    makeBoundExpressionAssignRule,
    makeLogicalExpressionAssignRule,
    makeFilteringExpressionAssignRule,
    makeWhereLogicalExpressionAssignRule,
    BoundExpressionType,
    LogicalExpressionType,
    FilteringExpressionType,
    WhereLogicalExpressionType,
} from './expression';

export type AllRowsClauseType = CommonType<'allRowsClause'> & {
    value: string;
};

export const isAllRowsClauseType = (value: unknown): value is AllRowsClauseType => {
    return isCommonType(value) && value.type === 'allRowsClause';
};

export const makeAllRowsClauseAssignRule: AssignForValueRule<
    AllRowsClauseTypeClass,
    AllRowsClauseType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAllRowsClauseTypeClass),
    construct: (clauseTypeClass: AllRowsClauseTypeClass) => {
        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value: clauseTypeClass.getValue(),
        };
    },
};

export type CatchClauseType = CommonType<'catchClause'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<QualifiedNameType>;
    block: ValueRuleValue<BlockType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isCatchClauseType = (value: unknown): value is CatchClauseType => {
    return isCommonType(value) && value.type === 'catchClause';
};

export const makeCatchClauseAssignRule: AssignForValueRule<CatchClauseTypeClass, CatchClauseType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isCatchClauseTypeClass),
        construct: (clauseTypeClass: CatchClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeIdAssignRule,
                makeErrorAssignRule,
            ]);

            const valueType = assignMultiClass(clauseTypeClass.getValueType(), [
                makeQualifiedNameAssignRule,
                makeErrorAssignRule,
            ]);

            const block = assignMultiClass(clauseTypeClass.getBlock(), [
                makeBlockAssignRule,
                makeErrorAssignRule,
            ]);

            const modifier = clauseTypeClass
                .getModifier()
                .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));

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

export type DataCategorySelectionType = CommonType<'dataCategorySelection'> & {
    value: ValueRuleValue<SoqlIdType>;
    selector: ValueRuleValue<FilteringSelectorType>;
    category: ValueRuleValue<DataCategoryNameType>;
};

export const isDataCategorySelectionType = (value: unknown): value is DataCategorySelectionType => {
    return isCommonType(value) && value.type === 'dataCategorySelection';
};

export const makeDataCategorySelectionAssignRule: AssignForValueRule<
    DataCategorySelectionTypeClass,
    DataCategorySelectionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDataCategorySelectionTypeClass),
    construct: (clauseTypeClass: DataCategorySelectionTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeSoqlIdAssignRule,
            makeErrorAssignRule,
        ]);

        const selector = assignMultiClass(clauseTypeClass.getSelector(), [
            makeFilteringSelectorAssignRule,
            makeErrorAssignRule,
        ]);

        const category = assignMultiClass(clauseTypeClass.getCategory(), [
            makeDataCategoryNameAssignRule,
            makeErrorAssignRule,
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

export type ElseClauseType = CommonType<'elseClause'> & {
    value: ValueRuleValue<FieldNameListType>;
};

export const isElseClauseType = (value: unknown): value is ElseClauseType => {
    return isCommonType(value) && value.type === 'elseClause';
};

export const makeElseClauseAssignRule: AssignForValueRule<ElseClauseTypeClass, ElseClauseType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isElseClauseTypeClass),
    construct: (clauseTypeClass: ElseClauseTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldNameListAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value,
        };
    },
};

export type FieldGroupByType = CommonType<'fieldGroupBy'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
};

export const isFieldGroupByType = (value: unknown): value is FieldGroupByType => {
    return isCommonType(value) && value.type === 'fieldGroupBy';
};

export const makeFieldGroupByAssignRule: AssignForValueRule<
    FieldGroupByTypeClass,
    FieldGroupByType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByTypeClass),
    construct: (clauseTypeClass: FieldGroupByTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldNameAssignRule,
            makeSoqlFunctionAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value,
        };
    },
};

export type FieldOrderType = CommonType<'fieldOrder'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    direction: 'ASC' | 'DESC' | null;
    nulls: 'FIRST' | 'LAST' | null;
};

export const isFieldOrderType = (value: unknown): value is FieldOrderType => {
    return isCommonType(value) && value.type === 'fieldOrder';
};

export const makeFieldOrderAssignRule: AssignForValueRule<FieldOrderTypeClass, FieldOrderType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderTypeClass),
    construct: (clauseTypeClass: FieldOrderTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldNameAssignRule,
            makeSoqlFunctionAssignRule,
            makeErrorAssignRule,
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

export type FilteringSelectorType = CommonType<'filteringSelector'> & {
    value: 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';
};

export const isFilteringSelectorType = (value: unknown): value is FilteringSelectorType => {
    return isCommonType(value) && value.type === 'filteringSelector';
};

export const makeFilteringSelectorAssignRule: AssignForValueRule<
    FilteringSelectorTypeClass,
    FilteringSelectorType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFilteringSelectorTypeClass),
    construct: (clauseTypeClass: FilteringSelectorTypeClass) => {
        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value: clauseTypeClass.getValue(),
        };
    },
};

export type ForClausesType = CommonType<'forClauses'> & {
    value: ('VIEW' | 'UPDATE' | 'REFERENCE')[];
};

export const isForClausesType = (value: unknown): value is ForClausesType => {
    return isCommonType(value) && value.type === 'forClauses';
};

export const makeForClausesAssignRule: AssignForValueRule<ForClausesTypeClass, ForClausesType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isForClausesTypeClass),
    construct: (clauseTypeClass: ForClausesTypeClass) => {
        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value: clauseTypeClass.getValue(),
        };
    },
};

export type GroupByClauseType = CommonType<'groupByClause'> & {
    value: ValueRuleValue<FieldGroupByListType>;
    mode: 'ROLLUP' | 'CUBE' | null;
    having: ValueRuleValue<LogicalExpressionType | null>;
};

export const isGroupByClauseType = (value: unknown): value is GroupByClauseType => {
    return isCommonType(value) && value.type === 'groupByClause';
};

export const makeGroupByClauseAssignRule: AssignForValueRule<
    GroupByClauseTypeClass,
    GroupByClauseType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isGroupByClauseTypeClass),
    construct: (clauseTypeClass: GroupByClauseTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldGroupByListAssignRule,
            makeErrorAssignRule,
        ]);

        const mode = clauseTypeClass.getMode();

        const having = assignMultiClass(clauseTypeClass.getHaving(), [
            makeLogicalExpressionAssignRule,
            makeErrorAssignRule,
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

export type LimitClauseType = CommonType<'limitClause'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isLimitClauseType = (value: unknown): value is LimitClauseType => {
    return isCommonType(value) && value.type === 'limitClause';
};

export const makeLimitClauseAssignRule: AssignForValueRule<LimitClauseTypeClass, LimitClauseType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isLimitClauseTypeClass),
        construct: (clauseTypeClass: LimitClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeStringAssignRule,
                makeBoundExpressionAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };

export type OffsetClauseType = CommonType<'offsetClause'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isOffsetClauseType = (value: unknown): value is OffsetClauseType => {
    return isCommonType(value) && value.type === 'offsetClause';
};

export const makeOffsetClauseAssignRule: AssignForValueRule<
    OffsetClauseTypeClass,
    OffsetClauseType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isOffsetClauseTypeClass),
    construct: (clauseTypeClass: OffsetClauseTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeStringAssignRule,
            makeBoundExpressionAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value,
        };
    },
};

export type OrderByClauseType = CommonType<'orderByClause'> & {
    value: ValueRuleValue<FieldOrderListType>;
};

export const isOrderByClauseType = (value: unknown): value is OrderByClauseType => {
    return isCommonType(value) && value.type === 'orderByClause';
};

export const makeOrderByClauseAssignRule: AssignForValueRule<
    OrderByClauseTypeClass,
    OrderByClauseType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isOrderByClauseTypeClass),
    construct: (clauseTypeClass: OrderByClauseTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldOrderListAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value,
        };
    },
};

export type SoslClausesType = CommonType<'soslClauses'> & {
    value: ValueRuleValue<SearchGroupType | null>;
    fieldSpecList: ValueRuleValue<FieldSpecListType | null>;
    withList: ValueRuleValue<SoslWithClauseType>[] | null;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export const isSoslClausesType = (value: unknown): value is SoslClausesType => {
    return isCommonType(value) && value.type === 'soslClauses';
};

export const makeSoslClausesAssignRule: AssignForValueRule<SoslClausesTypeClass, SoslClausesType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslClausesTypeClass),
        construct: (clauseTypeClass: SoslClausesTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeSearchGroupAssignRule,
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const fieldSpecList = assignMultiClass(clauseTypeClass.getFieldSpecList(), [
                makeFieldSpecListAssignRule,
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const withListValue = clauseTypeClass.getWithList();
            let withList = null;
            if (withListValue) {
                withList = withListValue.map((v) =>
                    assignMultiClass(v, [makeSoslWithClauseAssignRule, makeErrorAssignRule]),
                );
            }

            const limitClause = assignMultiClass(clauseTypeClass.getLimitClause(), [
                makeLimitClauseAssignRule,
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            const updateList = assignMultiClass(clauseTypeClass.getUpdateList(), [
                makeUpdateListAssignRule,
                makeErrorAssignRule,
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

export type SoslWithClauseType = CommonType<'soslWithClause'> &
    (
        | {
              value: 'DIVISION' | 'PRICEBOOKID';
              content: ValueRuleValue<string | BoundExpressionType>;
          }
        | {
              value: 'DATA_CATEGORY';
              content: ValueRuleValue<FilteringExpressionType>;
          }
        | {
              value: 'SNIPPET' | 'SPELL_CORRECTION';
              content: string | null;
          }
        | {
              value: 'NETWORK';
              content: ValueRuleValue<string | NetworkListType>;
          }
        | {
              value: 'METADATA';
              content: string;
          }
        | {
              value: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE';
          }
    );

export const isSoslWithClauseType = (value: unknown): value is SoslWithClauseType => {
    return isCommonType(value) && value.type === 'soslWithClause';
};

export const makeSoslWithClauseAssignRule: AssignForValueRule<
    SoslWithClauseTypeClass,
    SoslWithClauseType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslWithClauseTypeClass),
    construct: (clauseTypeClass: SoslWithClauseTypeClass) => {
        const value = clauseTypeClass.getValue();

        if (value === 'DIVISION' || value === 'PRICEBOOKID') {
            const content = assignMultiClass(clauseTypeClass.getContent(), [
                makeStringAssignRule,
                makeBoundExpressionAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                content,
            };
        } else if (value === 'DATA_CATEGORY') {
            const content = assignMultiClass(clauseTypeClass.getContent(), [
                makeFilteringExpressionAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                content,
            };
        } else if (value === 'SNIPPET' || value === 'SPELL_CORRECTION') {
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                content: clauseTypeClass.getContent() as string | null,
            };
        } else if (value === 'NETWORK') {
            const content = assignMultiClass(clauseTypeClass.getContent(), [
                makeStringAssignRule,
                makeNetworkListAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                content,
            };
        } else if (value === 'METADATA') {
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                content: clauseTypeClass.getContent() as string,
            };
        } else {
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        }
    },
};

export type TypeOfType = CommonType<'typeOf'> & {
    value: ValueRuleValue<FieldNameType>;
    whenClause: ValueRuleValue<WhenClauseType>[];
    elseClause: ValueRuleValue<ElseClauseType | null>;
};

export const isTypeOfType = (value: unknown): value is TypeOfType => {
    return isCommonType(value) && value.type === 'typeOf';
};

export const makeTypeOfAssignRule: AssignForValueRule<TypeOfTypeClass, TypeOfType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeOfTypeClass),
    construct: (clauseTypeClass: TypeOfTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldNameAssignRule,
            makeErrorAssignRule,
        ]);

        const whenClause = clauseTypeClass
            .getWhenClause()
            .map((v) => assignMultiClass(v, [makeWhenClauseAssignRule, makeErrorAssignRule]));

        const elseClause = assignMultiClass(clauseTypeClass.getElseClause(), [
            makeElseClauseAssignRule,
            makeErrorAssignRule,
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

export type UpdateTypeType = CommonType<'updateType'> & {
    value: 'TRACKING' | 'VIEWSTAT';
};

export const isUpdateTypeType = (value: unknown): value is UpdateTypeType => {
    return isCommonType(value) && value.type === 'updateType';
};

export const makeUpdateTypeAssignRule: AssignForValueRule<UpdateTypeTypeClass, UpdateTypeType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isUpdateTypeTypeClass),
    construct: (clauseTypeClass: UpdateTypeTypeClass) => {
        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value: clauseTypeClass.getValue(),
        };
    },
};

export type UsingScopeType = CommonType<'usingScope'> & {
    value: ValueRuleValue<SoqlIdType>;
};

export const isUsingScopeType = (value: unknown): value is UsingScopeType => {
    return isCommonType(value) && value.type === 'usingScope';
};

export const makeUsingScopeAssignRule: AssignForValueRule<UsingScopeTypeClass, UsingScopeType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isUsingScopeTypeClass),
    construct: (clauseTypeClass: UsingScopeTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeSoqlIdAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value,
        };
    },
};

export type WhenClauseType = CommonType<'whenClause'> & {
    value: ValueRuleValue<FieldNameType>;
    field: ValueRuleValue<FieldNameListType>;
};

export const isWhenClauseType = (value: unknown): value is WhenClauseType => {
    return isCommonType(value) && value.type === 'whenClause';
};

export const makeWhenClauseAssignRule: AssignForValueRule<WhenClauseTypeClass, WhenClauseType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWhenClauseTypeClass),
    construct: (clauseTypeClass: WhenClauseTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeFieldNameAssignRule,
            makeErrorAssignRule,
        ]);

        const field = assignMultiClass(clauseTypeClass.getField(), [
            makeFieldNameListAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: clauseTypeClass.getType(),
            sourceInfo: makeSourceInfo(clauseTypeClass),
            value,
            field,
        };
    },
};

export type WhereClauseType = CommonType<'whereClause'> & {
    value: ValueRuleValue<WhereLogicalExpressionType>;
};

export const isWhereClauseType = (value: unknown): value is WhereClauseType => {
    return isCommonType(value) && value.type === 'whereClause';
};

export const makeWhereClauseAssignRule: AssignForValueRule<WhereClauseTypeClass, WhereClauseType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereClauseTypeClass),
        construct: (clauseTypeClass: WhereClauseTypeClass) => {
            const value = assignMultiClass(clauseTypeClass.getValue(), [
                makeWhereLogicalExpressionAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        },
    };

export type WithClauseType = CommonType<'withClause'> &
    (
        | {
              value: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED';
          }
        | {
              value: ValueRuleValue<LogicalExpressionType>;
          }
        | {
              value: 'DATA_CATEGORY';
              field: ValueRuleValue<FilteringExpressionType>;
          }
    );

export const isWithClauseType = (value: unknown): value is WithClauseType => {
    return isCommonType(value) && value.type === 'withClause';
};

export const makeWithClauseAssignRule: AssignForValueRule<WithClauseTypeClass, WithClauseType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWithClauseTypeClass),
    construct: (clauseTypeClass: WithClauseTypeClass) => {
        const value = assignMultiClass(clauseTypeClass.getValue(), [
            makeLimitedStringAssignRule([
                'SYSTEM_MODE',
                'USER_MODE',
                'SECURITY_ENFORCED',
                'DATA_CATEGORY',
            ]),
            makeLogicalExpressionAssignRule,
            makeErrorAssignRule,
        ]);

        if (value === 'DATA_CATEGORY') {
            const field = assignMultiClass(clauseTypeClass.getField(), [
                makeFilteringExpressionAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
                field,
            };
        } else {
            return {
                type: clauseTypeClass.getType(),
                sourceInfo: makeSourceInfo(clauseTypeClass),
                value,
            };
        }
    },
};

