import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { IdType, SoqlIdType } from './id';
import { QualifiedNameType, DataCategoryNameType, FieldNameType } from './name';
import { BlockType } from './block';
import { ModifierType } from './modifier';
import {
    FieldGroupByListType,
    FieldNameListType,
    FieldOrderListType,
    FieldSpecListType,
    NetworkListType,
    UpdateListType,
} from './list';
import { SoqlFunctionType, SearchGroupType } from './query';
import {
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

export type CatchClauseType = CommonType<'catchClause'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<QualifiedNameType>;
    block: ValueRuleValue<BlockType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isCatchClauseType = (value: unknown): value is CatchClauseType => {
    return isCommonType(value) && value.type === 'catchClause';
};

export type DataCategorySelectionType = CommonType<'dataCategorySelection'> & {
    value: ValueRuleValue<SoqlIdType>;
    selector: ValueRuleValue<FilteringSelectorType>;
    category: ValueRuleValue<DataCategoryNameType>;
};

export const isDataCategorySelectionType = (value: unknown): value is DataCategorySelectionType => {
    return isCommonType(value) && value.type === 'dataCategorySelection';
};

export type ElseClauseType = CommonType<'elseClause'> & {
    value: ValueRuleValue<FieldNameListType>;
};

export const isElseClauseType = (value: unknown): value is ElseClauseType => {
    return isCommonType(value) && value.type === 'elseClause';
};

export type FieldGroupByType = CommonType<'fieldGroupBy'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
};

export const isFieldGroupByType = (value: unknown): value is FieldGroupByType => {
    return isCommonType(value) && value.type === 'fieldGroupBy';
};

export type FieldOrderType = CommonType<'fieldOrder'> & {
    value: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    direction: 'ASC' | 'DESC' | null;
    nulls: 'FIRST' | 'LAST' | null;
};

export const isFieldOrderType = (value: unknown): value is FieldOrderType => {
    return isCommonType(value) && value.type === 'fieldOrder';
};

export type FilteringSelectorType = CommonType<'filteringSelector'> & {
    value: 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';
};

export const isFilteringSelectorType = (value: unknown): value is FilteringSelectorType => {
    return isCommonType(value) && value.type === 'filteringSelector';
};

export type ForClausesType = CommonType<'forClauses'> & {
    value: ('VIEW' | 'UPDATE' | 'REFERENCE')[];
};

export const isForClausesType = (value: unknown): value is ForClausesType => {
    return isCommonType(value) && value.type === 'forClauses';
};

export type GroupByClauseType = CommonType<'groupByClause'> & {
    value: ValueRuleValue<FieldGroupByListType>;
    mode: 'ROLLUP' | 'CUBE' | null;
    having: ValueRuleValue<LogicalExpressionType | null>;
};

export const isGroupByClauseType = (value: unknown): value is GroupByClauseType => {
    return isCommonType(value) && value.type === 'groupByClause';
};

export type LimitClauseType = CommonType<'limitClause'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isLimitClauseType = (value: unknown): value is LimitClauseType => {
    return isCommonType(value) && value.type === 'limitClause';
};

export type OffsetClauseType = CommonType<'offsetClause'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
};

export const isOffsetClauseType = (value: unknown): value is OffsetClauseType => {
    return isCommonType(value) && value.type === 'offsetClause';
};

export type OrderByClauseType = CommonType<'orderByClause'> & {
    value: ValueRuleValue<FieldOrderListType>;
};

export const isOrderByClauseType = (value: unknown): value is OrderByClauseType => {
    return isCommonType(value) && value.type === 'orderByClause';
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

export type TypeOfType = CommonType<'typeOf'> & {
    value: ValueRuleValue<FieldNameType>;
    whenClause: ValueRuleValue<WhenClauseType>[];
    elseClause: ValueRuleValue<ElseClauseType | null>;
};

export const isTypeOfType = (value: unknown): value is TypeOfType => {
    return isCommonType(value) && value.type === 'typeOf';
};

export type UpdateTypeType = CommonType<'updateType'> & {
    value: 'TRACKING' | 'VIEWSTAT';
};

export const isUpdateTypeType = (value: unknown): value is UpdateTypeType => {
    return isCommonType(value) && value.type === 'updateType';
};

export type UsingScopeType = CommonType<'usingScope'> & {
    value: ValueRuleValue<SoqlIdType>;
};

export const isUsingScopeType = (value: unknown): value is UsingScopeType => {
    return isCommonType(value) && value.type === 'usingScope';
};

export type WhenClauseType = CommonType<'whenClause'> & {
    value: ValueRuleValue<FieldNameType>;
    field: ValueRuleValue<FieldNameListType>;
};

export const isWhenClauseType = (value: unknown): value is WhenClauseType => {
    return isCommonType(value) && value.type === 'whenClause';
};

export type WhereClauseType = CommonType<'whereClause'> & {
    value: ValueRuleValue<WhereLogicalExpressionType>;
};

export const isWhereClauseType = (value: unknown): value is WhereClauseType => {
    return isCommonType(value) && value.type === 'whereClause';
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
