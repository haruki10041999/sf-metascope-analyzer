import typia from 'typia';

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
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
    makeStringAssignRule,
} from './commons';
import {
    makeAllRowsClauseRule,
    makeForClausesRule,
    makeGroupByClauseRule,
    makeLimitClauseRule,
    makeOffsetClauseRule,
    makeOrderByClauseRule,
    makeUsingScopeRule,
    makeWhereClauseRule,
    makeWithClauseRule,
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
import { makeLogicalExpressionRule, LogicalExpressionType } from './expression';
import { makeSoslIdRule, SoslIdType } from './id';
import {
    makeFieldListRule,
    makeFieldOrderListRule,
    makeFromNameListRule,
    makeSelectListRule,
    makeSubFieldListRule,
    makeUpdateListRule,
    FieldListType,
    FieldOrderListType,
    FromNameListType,
    SelectListType,
    SubFieldListType,
    UpdateListType,
} from './list';
import { makeSignedIntegerRule, SignedIntegerType } from './literal';
import { makeDateFieldNameRule, makeFieldNameRule, DateFieldNameType, FieldNameType } from './name';
import { makeSoqlFieldsParameterRule, SoqlFieldsParameterType } from './parameter';
import { makeLocationValueRule, LocationValueType } from './value';

export type ComparisonOperatorType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isComparisonOperatorType = typia.createIs<ComparisonOperatorType>();

export const makeComparisonOperatorRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ComparisonOperatorTypeClass, ComparisonOperatorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isComparisonOperatorTypeClass),
        construct: (queryTypeClass: ComparisonOperatorTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
            };
        },
    };
};

export type DateFormulaType = CommonType & {
    value: ValueRuleValue<string>;
    param: ValueRuleValue<SignedIntegerType | null>;
};

export const isDateFormulaType = typia.createIs<DateFormulaType>();

export const makeDateFormulaRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFormulaTypeClass, DateFormulaType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFormulaTypeClass),
        construct: (queryTypeClass: DateFormulaTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeSignedIntegerRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        },
    };
};

export type FieldSpecType = CommonType & {
    value: ValueRuleValue<SoslIdType>;
    fieldList: ValueRuleValue<FieldListType | null>;
    where: ValueRuleValue<LogicalExpressionType | null>;
    listView: ValueRuleValue<SoslIdType | null>;
    orderBy: ValueRuleValue<FieldOrderListType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    offsetClause: ValueRuleValue<OffsetClauseType | null>;
};

export const isFieldSpecType = typia.createIs<FieldSpecType>();

export const makeFieldSpecRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldSpecTypeClass, FieldSpecType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecTypeClass),
        construct: (queryTypeClass: FieldSpecTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeSoslIdRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const fieldList = assignMultiClass(queryTypeClass.getFieldList(), [
                makeFieldListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const where = assignMultiClass(queryTypeClass.getWhere(), [
                makeLogicalExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const listView = assignMultiClass(queryTypeClass.getListView(), [
                makeSoslIdRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const orderBy = assignMultiClass(queryTypeClass.getOrderBy(), [
                makeFieldOrderListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const offsetClause = assignMultiClass(queryTypeClass.getOffsetClause(), [
                makeOffsetClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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
};

export type QueryType = CommonType & {
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

export const isQueryType = typia.createIs<QueryType>();

export const makeQueryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalQueryTypeClass, QueryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalQueryType),
        construct: (queryTypeClass: NormalQueryTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeSelectListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const from = assignMultiClass(queryTypeClass.getFrom(), [
                makeFromNameListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const whereClause = assignMultiClass(queryTypeClass.getWhereClause(), [
                makeWhereClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const orderByClause = assignMultiClass(queryTypeClass.getOrderByClause(), [
                makeOrderByClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const forClause = assignMultiClass(queryTypeClass.getForClause(), [
                makeForClausesRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const offsetClause = assignMultiClass(queryTypeClass.getOffsetClause(), [
                makeOffsetClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const allRowsClause = assignMultiClass(queryTypeClass.getAllRowsClause(), [
                makeAllRowsClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const usingScope = assignMultiClass(queryTypeClass.getUsingScope(), [
                makeUsingScopeRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const groupByClause = assignMultiClass(queryTypeClass.getGroupByClause(), [
                makeGroupByClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const updateList = assignMultiClass(queryTypeClass.getUpdateList(), [
                makeUpdateListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const withClause = assignMultiClass(queryTypeClass.getWithClause(), [
                makeWithClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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
};

export type SearchGroupType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isSearchGroupType = typia.createIs<SearchGroupType>();

export const makeSearchGroupRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SearchGroupTypeClass, SearchGroupType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSearchGroupTypeClass),
        construct: (queryTypeClass: SearchGroupTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
            };
        },
    };
};

export type SoqlFunctionType = CommonType & {
    value: ValueRuleValue<string>;
    param: ValueRuleValue<
        | ValueRuleValue<LocationValueType | string>[]
        | FieldNameType
        | DateFieldNameType
        | SoqlFunctionType
        | SoqlFieldsParameterType
        | null
    >;
};

export const isSoqlFunctionType = typia.createIs<SoqlFunctionType>();

export const makeSoqlFunctionRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFunctionTypeClass, SoqlFunctionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFunctionTypeClass),
        construct: (queryTypeClass: SoqlFunctionTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
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
                                makeLocationValueRule(errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]),
                        );
                    },
                },
                makeFieldNameRule(errorInfo),
                makeDateFieldNameRule(errorInfo),
                makeSoqlFieldsParameterRule(errorInfo),
                makeSoqlFunctionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: queryTypeClass.getType(),
                sourceInfo: makeSourceInfo(queryTypeClass),
                value,
                param,
            };
        },
    };
};

export type SubQueryType = CommonType & {
    value: ValueRuleValue<SubFieldListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType | null>;
    whereClause: ValueRuleValue<WhereClauseType | null>;
    orderByClause: ValueRuleValue<OrderByClauseType | null>;
    limitClause: ValueRuleValue<LimitClauseType | null>;
    updateList: ValueRuleValue<UpdateListType | null>;
};

export const isSubQueryType = typia.createIs<SubQueryType>();

export const makeSubQueryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubQueryTypeClass, SubQueryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubQueryTypeClass),
        construct: (queryTypeClass: SubQueryTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeSubFieldListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const from = assignMultiClass(queryTypeClass.getFrom(), [
                makeFromNameListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const whereClause = assignMultiClass(queryTypeClass.getWhereClause(), [
                makeWhereClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const orderByClause = assignMultiClass(queryTypeClass.getOrderByClause(), [
                makeOrderByClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const forClause = assignMultiClass(queryTypeClass.getForClause(), [
                makeForClausesRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const updateList = assignMultiClass(queryTypeClass.getUpdateList(), [
                makeUpdateListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
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
};

