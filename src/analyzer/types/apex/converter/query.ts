import {
    ComparisonOperatorTypeClass,
    DateFormulaTypeClass,
    ErrorTypeClass,
    FieldSpecTypeClass,
    LocationValueTypeClass,
    NormalQueryTypeClass,
    SearchGroupTypeClass,
    SoqlFunctionTypeClass,
    SubQueryTypeClass,
    isComparisonOperatorType as isComparisonOperatorTypeClass,
    isDateFormulaType as isDateFormulaTypeClass,
    isErrorType,
    isFieldSpecType as isFieldSpecTypeClass,
    isLocationValueType,
    isNormalQueryType,
    isSearchGroupType as isSearchGroupTypeClass,
    isSoqlFunctionType as isSoqlFunctionTypeClass,
    isSubQueryType as isSubQueryTypeClass,
} from '../../apex_IR';
import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeLimitedStringAssignRule,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
    makeStringAssignRule,
} from './commons';
import {
    makeAllRowsClauseAssignRule,
    makeForClausesAssignRule,
    makeGroupByClauseAssignRule,
    makeLimitClauseAssignRule,
    makeOffsetClauseAssignRule,
    makeOrderByClauseAssignRule,
    makeUsingScopeAssignRule,
    makeWhereClauseAssignRule,
    makeWithClauseAssignRule,
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
import { makeLogicalExpressionAssignRule, LogicalExpressionType } from './expression';
import { makeSoslIdAssignRule, SoslIdType } from './id';
import {
    makeFieldListAssignRule,
    makeFieldOrderListAssignRule,
    makeFromNameListAssignRule,
    makeSelectListAssignRule,
    makeSubFieldListAssignRule,
    makeUpdateListAssignRule,
    FieldListType,
    FieldOrderListType,
    FromNameListType,
    SelectListType,
    SubFieldListType,
    UpdateListType,
} from './list';
import { makeSignedIntegerAssignRule, SignedIntegerType } from './literal';
import {
    makeDateFieldNameAssignRule,
    makeFieldNameAssignRule,
    DateFieldNameType,
    FieldNameType,
} from './name';
import { makeSoqlFieldsParameterAssignRule, SoqlFieldsParameterType } from './parameter';
import { makeLocationValueAssignRule, LocationValueType } from './value';

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

export const makeComparisonOperatorAssignRule: AssignForValueRule<
    ComparisonOperatorTypeClass,
    ComparisonOperatorType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isComparisonOperatorTypeClass),
    construct: (queryTypeClass: ComparisonOperatorTypeClass) => {
        return {
            type: queryTypeClass.getType(),
            sourceInfo: makeSourceInfo(queryTypeClass),
            value: queryTypeClass.getValue(),
        };
    },
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

export const makeDateFormulaAssignRule: AssignForValueRule<DateFormulaTypeClass, DateFormulaType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFormulaTypeClass),
        construct: (queryTypeClass: DateFormulaTypeClass) => {
            const value = queryTypeClass.getValue();

            if (
                value === 'YESTERDAY' ||
                value === 'TODAY' ||
                value === 'TOMORROW' ||
                value === 'LAST_WEEK' ||
                value === 'THIS_WEEK' ||
                value === 'NEXT_WEEK' ||
                value === 'LAST_MONTH' ||
                value === 'THIS_MONTH' ||
                value === 'NEXT_MONTH' ||
                value === 'LAST_90_DAYS' ||
                value === 'NEXT_90_DAYS' ||
                value === 'THIS_QUARTER' ||
                value === 'LAST_QUARTER' ||
                value === 'NEXT_QUARTER' ||
                value === 'THIS_YEAR' ||
                value === 'LAST_YEAR' ||
                value === 'NEXT_YEAR' ||
                value === 'THIS_FISCAL_QUARTER' ||
                value === 'LAST_FISCAL_QUARTER' ||
                value === 'NEXT_FISCAL_QUARTER' ||
                value === 'THIS_FISCAL_YEAR' ||
                value === 'LAST_FISCAL_YEAR' ||
                value === 'NEXT_FISCAL_YEAR'
            ) {
                return {
                    type: queryTypeClass.getType(),
                    sourceInfo: makeSourceInfo(queryTypeClass),
                    value,
                };
            } else {
                const param = assignMultiClass(queryTypeClass.getParam(), [
                    makeSignedIntegerAssignRule,
                    makeErrorAssignRule,
                ]);
                return {
                    type: queryTypeClass.getType(),
                    sourceInfo: makeSourceInfo(queryTypeClass),
                    value,
                    param,
                };
            }
        },
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

export const makeFieldSpecAssignRule: AssignForValueRule<FieldSpecTypeClass, FieldSpecType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecTypeClass),
    construct: (queryTypeClass: FieldSpecTypeClass) => {
        const value = assignMultiClass(queryTypeClass.getValue(), [
            makeSoslIdAssignRule,
            makeErrorAssignRule,
        ]);
        const fieldList = assignMultiClass(queryTypeClass.getFieldList(), [
            makeFieldListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const where = assignMultiClass(queryTypeClass.getWhere(), [
            makeLogicalExpressionAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const listView = assignMultiClass(queryTypeClass.getListView(), [
            makeSoslIdAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const orderBy = assignMultiClass(queryTypeClass.getOrderBy(), [
            makeFieldOrderListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
            makeLimitClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const offsetClause = assignMultiClass(queryTypeClass.getOffsetClause(), [
            makeOffsetClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: queryTypeClass.getType(),
            sourceInfo: makeSourceInfo(queryTypeClass),
            value,
            fieldList,
            where,
            listView,
            orderBy,
            limitClause,
            offsetClause,
        };
    },
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

export const makeQueryAssignRule: AssignForValueRule<NormalQueryTypeClass, QueryType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalQueryType),
    construct: (queryTypeClass: NormalQueryTypeClass) => {
        const value = assignMultiClass(queryTypeClass.getValue(), [
            makeSelectListAssignRule,
            makeErrorAssignRule,
        ]);
        const from = assignMultiClass(queryTypeClass.getFrom(), [
            makeFromNameListAssignRule,
            makeErrorAssignRule,
        ]);
        const whereClause = assignMultiClass(queryTypeClass.getWhereClause(), [
            makeWhereClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const orderByClause = assignMultiClass(queryTypeClass.getOrderByClause(), [
            makeOrderByClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const forClause = assignMultiClass(queryTypeClass.getForClause(), [
            makeForClausesAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
            makeLimitClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const offsetClause = assignMultiClass(queryTypeClass.getOffsetClause(), [
            makeOffsetClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const allRowsClause = assignMultiClass(queryTypeClass.getAllRowsClause(), [
            makeAllRowsClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const usingScope = assignMultiClass(queryTypeClass.getUsingScope(), [
            makeUsingScopeAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const groupByClause = assignMultiClass(queryTypeClass.getGroupByClause(), [
            makeGroupByClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const updateList = assignMultiClass(queryTypeClass.getUpdateList(), [
            makeUpdateListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const withClause = assignMultiClass(queryTypeClass.getWithClause(), [
            makeWithClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        return {
            type: queryTypeClass.getType(),
            sourceInfo: makeSourceInfo(queryTypeClass),
            value,
            from,
            forClause,
            usingScope,
            whereClause,
            withClause,
            groupByClause,
            orderByClause,
            limitClause,
            offsetClause,
            allRowsClause,
            updateList,
        };
    },
};

export type SearchGroupType = CommonType<'searchGroup'> & {
    value: 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';
};

export const isSearchGroupType = (value: unknown): value is SearchGroupType => {
    return isCommonType(value) && value.type === 'searchGroup';
};

export const makeSearchGroupAssignRule: AssignForValueRule<SearchGroupTypeClass, SearchGroupType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSearchGroupTypeClass),
        construct: (queryTypeClass: SearchGroupTypeClass) => {
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value: queryTypeClass.getValue(),
            };
        },
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

export const makeSoqlFunctionAssignRule: AssignForValueRule<
    SoqlFunctionTypeClass,
    SoqlFunctionType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFunctionTypeClass),
    construct: (queryTypeClass: SoqlFunctionTypeClass) => {
        const value = queryTypeClass.getValue();

        if (
            value === 'AVG' ||
            value === 'COUNT_DISTINCT' ||
            value === 'MIN' ||
            value === 'MAX' ||
            value === 'SUM' ||
            value === 'TOLABEL' ||
            value === 'GROUPING' ||
            value === 'CONVERT_CURRENCY'
        ) {
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeFieldNameAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        } else if (
            value === 'CALENDAR_MONTH' ||
            value === 'CALENDAR_QUARTER' ||
            value === 'CALENDAR_YEAR' ||
            value === 'DAY_IN_MONTH' ||
            value === 'DAY_IN_WEEK' ||
            value === 'DAY_IN_YEAR' ||
            value === 'DAY_ONLY' ||
            value === 'FISCAL_MONTH' ||
            value === 'FISCAL_QUARTER' ||
            value === 'FISCAL_YEAR' ||
            value === 'HOUR_IN_DAY' ||
            value === 'WEEK_IN_MONTH' ||
            value === 'WEEK_IN_YEAR'
        ) {
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeDateFieldNameAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        } else if (value === 'COUNT') {
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeFieldNameAssignRule,
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        } else if (value === 'FIELDS') {
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeSoqlFieldsParameterAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        } else if (value === 'FORMAT') {
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeFieldNameAssignRule,
                makeSoqlFunctionAssignRule,
                makeErrorAssignRule,
            ]);

            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        } else {
            const param = assignMultiClass(queryTypeClass.getParam(), [
                {
                    isValid: (
                        target: unknown,
                    ): target is (LocationValueTypeClass | ErrorTypeClass | string)[] =>
                        Array.isArray(target) &&
                        target.every(
                            (t) =>
                                isTargetTypeClass(t, isLocationValueType) ||
                                typeof t === 'string' ||
                                isTargetTypeClass(t, isErrorType),
                        ),
                    construct: (values: (LocationValueTypeClass | ErrorTypeClass | string)[]) => {
                        return values.map((v) =>
                            assignMultiClass(v, [
                                makeStringAssignRule,
                                makeLocationValueAssignRule,
                                makeErrorAssignRule,
                            ]),
                        );
                    },
                },
            ]);

            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        }
    },
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

export const makeSubQueryAssignRule: AssignForValueRule<SubQueryTypeClass, SubQueryType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSubQueryTypeClass),
    construct: (queryTypeClass: SubQueryTypeClass) => {
        const value = assignMultiClass(queryTypeClass.getValue(), [
            makeSubFieldListAssignRule,
            makeErrorAssignRule,
        ]);
        const from = assignMultiClass(queryTypeClass.getFrom(), [
            makeFromNameListAssignRule,
            makeErrorAssignRule,
        ]);
        const whereClause = assignMultiClass(queryTypeClass.getWhereClause(), [
            makeWhereClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const orderByClause = assignMultiClass(queryTypeClass.getOrderByClause(), [
            makeOrderByClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const forClause = assignMultiClass(queryTypeClass.getForClause(), [
            makeForClausesAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
            makeLimitClauseAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const updateList = assignMultiClass(queryTypeClass.getUpdateList(), [
            makeUpdateListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);

        return {
            type: queryTypeClass.getType(),
            sourceInfo: makeSourceInfo(queryTypeClass),
            value,
            from,
            forClause,
            whereClause,
            orderByClause,
            limitClause,
            updateList,
        };
    },
};

