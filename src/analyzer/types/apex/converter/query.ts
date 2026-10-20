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

export type ComparisonOperatorType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isComparisonOperatorType = typia.createIs<ComparisonOperatorType>();

export const makeComparisonOperatorRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ComparisonOperatorTypeClass, ComparisonOperatorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isComparisonOperatorTypeClass),
        construct: (queryTypeClass: ComparisonOperatorTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(queryTypeClass));
            return { type: queryTypeClass.getType(), value };
        },
    };
};

export type DateFormulaType = {
    type: string;
    value: ValueRuleValue<string>;
    param: ValueRuleValue<SignedIntegerType>;
};

export const isDateFormulaType = typia.createIs<DateFormulaType>();

export const makeDateFormulaRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFormulaTypeClass, DateFormulaType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFormulaTypeClass),
        construct: (queryTypeClass: DateFormulaTypeClass) => {
            const node = makeSourceNode(queryTypeClass);
            const value = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeSignedIntegerRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: queryTypeClass.getType(), value, param };
        },
    };
};

export type FieldSpecType = {
    type: string;
    value: ValueRuleValue<SoslIdType>;
    fieldList: ValueRuleValue<FieldListType>;
    where: ValueRuleValue<LogicalExpressionType>;
    listView: ValueRuleValue<SoslIdType>;
    orderBy: ValueRuleValue<FieldOrderListType>;
    limitClause: ValueRuleValue<LimitClauseType>;
    offsetClause: ValueRuleValue<OffsetClauseType>;
};

export const isFieldSpecType = typia.createIs<FieldSpecType>();

export const makeFieldSpecRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldSpecTypeClass, FieldSpecType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecTypeClass),
        construct: (queryTypeClass: FieldSpecTypeClass) => {
            const node = makeSourceNode(queryTypeClass);
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeSoslIdRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const fieldList = assignMultiClass(queryTypeClass.getFieldList(), [
                makeFieldListRule(sourceField(node, 'fieldList'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const where = assignMultiClass(queryTypeClass.getWhere(), [
                makeLogicalExpressionRule(sourceField(node, 'where'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const listView = assignMultiClass(queryTypeClass.getListView(), [
                makeSoslIdRule(sourceField(node, 'listView'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const orderBy = assignMultiClass(queryTypeClass.getOrderBy(), [
                makeFieldOrderListRule(sourceField(node, 'orderBy'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(sourceField(node, 'limitClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const offsetClause = assignMultiClass(queryTypeClass.getOffsetClause(), [
                makeOffsetClauseRule(sourceField(node, 'offsetClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return {
                type: queryTypeClass.getType(),
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

export type QueryType = {
    type: string;
    value: ValueRuleValue<SelectListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType>;
    usingScope: ValueRuleValue<UsingScopeType>;
    whereClause: ValueRuleValue<WhereClauseType>;
    withClause: ValueRuleValue<WithClauseType>;
    groupByClause: ValueRuleValue<GroupByClauseType>;
    orderByClause: ValueRuleValue<OrderByClauseType>;
    limitClause: ValueRuleValue<LimitClauseType>;
    offsetClause: ValueRuleValue<OffsetClauseType>;
    allRowsClause: ValueRuleValue<AllRowsClauseType>;
    updateList: ValueRuleValue<UpdateListType>;
};

export const isQueryType = typia.createIs<QueryType>();

export const makeQueryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalQueryTypeClass, QueryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalQueryType),
        construct: (queryTypeClass: NormalQueryTypeClass) => {
            const node = makeSourceNode(queryTypeClass);
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeSelectListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const from = assignMultiClass(queryTypeClass.getFrom(), [
                makeFromNameListRule(sourceField(node, 'from'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const whereClause = assignMultiClass(queryTypeClass.getWhereClause(), [
                makeWhereClauseRule(sourceField(node, 'whereClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const orderByClause = assignMultiClass(queryTypeClass.getOrderByClause(), [
                makeOrderByClauseRule(sourceField(node, 'orderByClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const forClause = assignMultiClass(queryTypeClass.getForClause(), [
                makeForClausesRule(sourceField(node, 'forClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(sourceField(node, 'limitClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const offsetClause = assignMultiClass(queryTypeClass.getOffsetClause(), [
                makeOffsetClauseRule(sourceField(node, 'offsetClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const allRowsClause = assignMultiClass(queryTypeClass.getAllRowsClause(), [
                makeAllRowsClauseRule(sourceField(node, 'allRowsClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const usingScope = assignMultiClass(queryTypeClass.getUsingScope(), [
                makeUsingScopeRule(sourceField(node, 'usingScope'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const groupByClause = assignMultiClass(queryTypeClass.getGroupByClause(), [
                makeGroupByClauseRule(sourceField(node, 'groupByClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const updateList = assignMultiClass(queryTypeClass.getUpdateList(), [
                makeUpdateListRule(sourceField(node, 'updateList'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const withClause = assignMultiClass(queryTypeClass.getWithClause(), [
                makeWithClauseRule(sourceField(node, 'withClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: queryTypeClass.getType(),
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

export type SearchGroupType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isSearchGroupType = typia.createIs<SearchGroupType>();

export const makeSearchGroupRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SearchGroupTypeClass, SearchGroupType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSearchGroupTypeClass),
        construct: (queryTypeClass: SearchGroupTypeClass) => {
            const value = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(queryTypeClass));
            return { type: queryTypeClass.getType(), value };
        },
    };
};

export type SoqlFunctionType = {
    type: string;
    value: ValueRuleValue<string>;
    param: ValueRuleValue<
        | ValueRuleValue<LocationValueType | string>[]
        | FieldNameType
        | DateFieldNameType
        | SoqlFunctionType
        | SoqlFieldsParameterType
    >;
};

export const isSoqlFunctionType = typia.createIs<SoqlFunctionType>();

export const makeSoqlFunctionRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFunctionTypeClass, SoqlFunctionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFunctionTypeClass),
        construct: (queryTypeClass: SoqlFunctionTypeClass) => {
            const node = makeSourceNode(queryTypeClass);
            const value = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
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
                        const paramSource = sourceList(node, 'param');
                        return values.map((v, index) =>
                            assignMultiClass(v, [
                                {
                                    isValid: (target: unknown): target is string =>
                                        typeof target === 'string',
                                    construct: (value: string) => value,
                                },
                                makeLocationValueRule(paramSource(index), errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]),
                        );
                    },
                },
                makeFieldNameRule(sourceField(node, 'param'), errorInfo),
                makeDateFieldNameRule(sourceField(node, 'param'), errorInfo),
                makeSoqlFieldsParameterRule(sourceField(node, 'param'), errorInfo),
                makeSoqlFunctionRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: queryTypeClass.getType(), value, param };
        },
    };
};

export type SubQueryType = {
    type: string;
    value: ValueRuleValue<SubFieldListType>;
    from: ValueRuleValue<FromNameListType>;
    forClause: ValueRuleValue<ForClausesType>;
    whereClause: ValueRuleValue<WhereClauseType>;
    orderByClause: ValueRuleValue<OrderByClauseType>;
    limitClause: ValueRuleValue<LimitClauseType>;
    updateList: ValueRuleValue<UpdateListType>;
};

export const isSubQueryType = typia.createIs<SubQueryType>();

export const makeSubQueryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubQueryTypeClass, SubQueryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubQueryTypeClass),
        construct: (queryTypeClass: SubQueryTypeClass) => {
            const node = makeSourceNode(queryTypeClass);
            const value = assignMultiClass(queryTypeClass.getValue(), [
                makeSubFieldListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const from = assignMultiClass(queryTypeClass.getFrom(), [
                makeFromNameListRule(sourceField(node, 'from'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const whereClause = assignMultiClass(queryTypeClass.getWhereClause(), [
                makeWhereClauseRule(sourceField(node, 'whereClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const orderByClause = assignMultiClass(queryTypeClass.getOrderByClause(), [
                makeOrderByClauseRule(sourceField(node, 'orderByClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const forClause = assignMultiClass(queryTypeClass.getForClause(), [
                makeForClausesRule(sourceField(node, 'forClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const limitClause = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(sourceField(node, 'limitClause'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const updateList = assignMultiClass(queryTypeClass.getUpdateList(), [
                makeUpdateListRule(sourceField(node, 'updateList'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return {
                type: queryTypeClass.getType(),
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

