import { isCommonType, CommonType, ValueRuleValue } from './commons';
import {
    AllRowsClauseType,
    ForClausesType,
    GroupByClauseType,
    LimitClauseType,
    OffsetClauseType,
    OrderByClauseType,
    UsingScopeType,
    WhereClauseType,
    WithClauseType,
} from './clause';
import { LogicalExpressionType } from './expression';
import { SoslIdType } from './id';
import {
    FieldListType,
    FieldOrderListType,
    FromNameListType,
    SelectListType,
    SubFieldListType,
    UpdateListType,
} from './list';
import { SignedIntegerType } from './literal';
import { DateFieldNameType, FieldNameType } from './name';
import { SoqlFieldsParameterType } from './parameter';
import { LocationValueType } from './value';

export type ComparisonOperatorType = CommonType<'comparisonOperator'> & {
    value:
        | '='
        | '!='
        | '<'
        | '>'
        | '<='
        | '>='
        | '<>'
        | 'LIKE'
        | 'IN'
        | 'NOT IN'
        | 'INCLUDES'
        | 'EXCLUDES';
};

export const isComparisonOperatorType = (value: unknown): value is ComparisonOperatorType => {
    return isCommonType(value) && value.type === 'comparisonOperator';
};

export type DateFormulaType = CommonType<'dateFormula'> &
    (
        | {
              value:
                  | 'YESTERDAY'
                  | 'TODAY'
                  | 'TOMORROW'
                  | 'LAST_WEEK'
                  | 'THIS_WEEK'
                  | 'NEXT_WEEK'
                  | 'LAST_MONTH'
                  | 'THIS_MONTH'
                  | 'NEXT_MONTH'
                  | 'LAST_90_DAYS'
                  | 'NEXT_90_DAYS'
                  | 'THIS_QUARTER'
                  | 'LAST_QUARTER'
                  | 'NEXT_QUARTER'
                  | 'THIS_YEAR'
                  | 'LAST_YEAR'
                  | 'NEXT_YEAR'
                  | 'THIS_FISCAL_QUARTER'
                  | 'LAST_FISCAL_QUARTER'
                  | 'NEXT_FISCAL_QUARTER'
                  | 'THIS_FISCAL_YEAR'
                  | 'LAST_FISCAL_YEAR'
                  | 'NEXT_FISCAL_YEAR';
          }
        | {
              value:
                  | 'LAST_N_DAYS_N'
                  | 'NEXT_N_DAYS_N'
                  | 'N_DAYS_AGO_N'
                  | 'NEXT_N_WEEKS_N'
                  | 'LAST_N_WEEKS_N'
                  | 'N_WEEKS_AGO_N'
                  | 'NEXT_N_MONTHS_N'
                  | 'LAST_N_MONTHS_N'
                  | 'N_MONTHS_AGO_N'
                  | 'NEXT_N_QUARTERS_N'
                  | 'LAST_N_QUARTERS_N'
                  | 'N_QUARTERS_AGO_N'
                  | 'NEXT_N_FISCAL_QUARTERS_N'
                  | 'LAST_N_FISCAL_QUARTERS_N'
                  | 'N_FISCAL_QUARTERS_AGO_N'
                  | 'NEXT_N_YEARS_N'
                  | 'LAST_N_YEARS_N'
                  | 'N_YEARS_AGO_N'
                  | 'NEXT_N_FISCAL_YEARS_N'
                  | 'LAST_N_FISCAL_YEARS_N'
                  | 'N_FISCAL_YEARS_AGO_N';
              param: ValueRuleValue<SignedIntegerType>;
          }
    );

export const isDateFormulaType = (value: unknown): value is DateFormulaType => {
    return isCommonType(value) && value.type === 'dateFormula';
};

export type FieldSpecType = CommonType<'fieldSpec'> & {
    value: ValueRuleValue<SoslIdType>;
    fieldList: ValueRuleValue<FieldListType | null>;
    where: ValueRuleValue<LogicalExpressionType | null>;
    listView: ValueRuleValue<SoslIdType | null>;
    orderBy: ValueRuleValue<FieldOrderListType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    offsetClause: ValueRuleValue<OffsetClauseType | null>;
};

export const isFieldSpecType = (value: unknown): value is FieldSpecType => {
    return isCommonType(value) && value.type === 'fieldSpec';
};

export type QueryType = CommonType<'query'> & {
    value: ValueRuleValue<SelectListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType | null>;
    usingScope: ValueRuleValue<UsingScopeType | null>;
    whereClause: ValueRuleValue<WhereClauseType | null>;
    withClause: ValueRuleValue<WithClauseType | null>;
    groupByClause: ValueRuleValue<GroupByClauseType | null>;
    orderByClause: ValueRuleValue<OrderByClauseType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    offsetClause: ValueRuleValue<OffsetClauseType | null>;
    allRowsClause: ValueRuleValue<AllRowsClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export const isQueryType = (value: unknown): value is QueryType => {
    return isCommonType(value) && value.type === 'query';
};

export type SearchGroupType = CommonType<'searchGroup'> & {
    value: 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';
};

export const isSearchGroupType = (value: unknown): value is SearchGroupType => {
    return isCommonType(value) && value.type === 'searchGroup';
};

export type SoqlFunctionType = CommonType<'soqlFunction'> &
    (
        | {
              value:
                  | 'AVG'
                  | 'COUNT_DISTINCT'
                  | 'MIN'
                  | 'MAX'
                  | 'SUM'
                  | 'TOLABEL'
                  | 'GROUPING'
                  | 'CONVERT_CURRENCY';
              param: ValueRuleValue<FieldNameType>;
          }
        | {
              value:
                  | 'CALENDAR_MONTH'
                  | 'CALENDAR_QUARTER'
                  | 'CALENDAR_YEAR'
                  | 'DAY_IN_MONTH'
                  | 'DAY_IN_WEEK'
                  | 'DAY_IN_YEAR'
                  | 'DAY_ONLY'
                  | 'FISCAL_MONTH'
                  | 'FISCAL_QUARTER'
                  | 'FISCAL_YEAR'
                  | 'HOUR_IN_DAY'
                  | 'WEEK_IN_MONTH'
                  | 'WEEK_IN_YEAR';
              param: ValueRuleValue<DateFieldNameType>;
          }
        | {
              value: 'COUNT';
              param: ValueRuleValue<FieldNameType | null>;
          }
        | {
              value: 'FORMAT';
              param: ValueRuleValue<FieldNameType | SoqlFunctionType>;
          }
        | {
              value: 'FIELDS';
              param: ValueRuleValue<SoqlFieldsParameterType>;
          }
        | {
              value: 'DISTANCE';
              param: ValueRuleValue<LocationValueType | string>[];
          }
    );

export const isSoqlFunctionType = (value: unknown): value is SoqlFunctionType => {
    return isCommonType(value) && value.type === 'soqlFunction';
};

export type SubQueryType = CommonType<'subQuery'> & {
    value: ValueRuleValue<SubFieldListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType | null>;
    whereClause: ValueRuleValue<WhereClauseType | null>;
    orderByClause: ValueRuleValue<OrderByClauseType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export const isSubQueryType = (value: unknown): value is SubQueryType => {
    return isCommonType(value) && value.type === 'subQuery';
};
