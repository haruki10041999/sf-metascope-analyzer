import {
    ComparisonOperatorTypeClass,
    DateFormulaTypeClass,
    ErrorTypeClass,
    FieldSpecTypeClass,
    LocationValueTypeClass,
    NormalQueryTypeClass,
    QueryTypeClass,
    SearchGroupTypeClass,
    SoqlFunctionTypeClass,
    SoqlQueryTypeClass,
    SubQueryTypeClass,
    isComparisonOperatorType,
    isDateFormulaType,
    isErrorType,
    isFieldSpecType,
    isLocationValueType,
    isNormalQueryType,
    isSearchGroupType,
    isSoqlFunctionType,
    isSubQueryType,
} from '../../apex_IR';
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
} from './clause';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeLogicalExpressionRule } from './expression';
import { makeSoslIdRule } from './id';
import {
    makeFieldListRule,
    makeFieldOrderListRule,
    makeFromNameListRule,
    makeSelectListRule,
    makeUpdateListRule,
} from './list';
import { makeSignedIntegerRule } from './literal';
import { makeDateFieldNameRule, makeFieldNameRule } from './name';
import { makeSoqlFieldsParameterRule } from './parameter';
import { makeLocationValueRule } from './value';

export const makeComparisonOperatorRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ComparisonOperatorTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isComparisonOperatorType),
        construct: (queryTypeClass: ComparisonOperatorTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeDateFormulaRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFormulaTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFormulaType),
        construct: (queryTypeClass: DateFormulaTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const func = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(queryTypeClass.getParam(), [
                makeSignedIntegerRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return { func, param };
        },
    };
};

export const makeFieldSpecRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldSpecTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecType),
        construct: (queryTypeClass: FieldSpecTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const object = assignMultiClass(queryTypeClass.getValue(), [
                makeSoslIdRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const fieldList = assignMultiClass(queryTypeClass.getFieldList(), [
                makeFieldListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const where = assignMultiClass(queryTypeClass.getWhere(), [
                makeLogicalExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const listView = assignMultiClass(queryTypeClass.getListView(), [
                makeSoslIdRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const orderBy = assignMultiClass(queryTypeClass.getOrderBy(), [
                makeFieldOrderListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const limit = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const offset = assignMultiClass(queryTypeClass.getOffsetClause, [
                makeOffsetClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return { object, fieldList, where, orderBy, listView, limit, offset };
        },
    };
};

export const makeQueryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalQueryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalQueryType),
        construct: (queryTypeClass: NormalQueryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const select = assignMultiClass(queryTypeClass.getValue(), [
                makeSelectListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const from = assignMultiClass(queryTypeClass.getFrom(), [
                makeFromNameListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const where = assignMultiClass(queryTypeClass.getWhereClause(), [
                makeWhereClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const orderBy = assignMultiClass(queryTypeClass.getOrderByClause(), [
                makeOrderByClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const forClause = assignMultiClass(queryTypeClass.getForClause(), [
                makeForClausesRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const limit = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const offset = assignMultiClass(queryTypeClass.getOffsetClause, [
                makeOffsetClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const allRows = assignMultiClass(queryTypeClass.getAllRowsClause(), [
                makeAllRowsClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const usingScope = assignMultiClass(queryTypeClass.getUsingScope(), [
                makeUsingScopeRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const groupBy = assignMultiClass(queryTypeClass.getGroupByClause(), [
                makeGroupByClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const update = assignMultiClass(queryTypeClass.getUpdateList(), [
                makeUpdateListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const withClause = assignMultiClass(queryTypeClass.getWithClause, [
                makeWithClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return {
                select,
                from,
                where,
                orderBy,
                limit,
                offset,
                withClause,
                update,
                groupBy,
                forClause,
                allRows,
                usingScope,
            };
        },
    };
};

export const makeSearchGroupRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SearchGroupTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSearchGroupType),
        construct: (queryTypeClass: SearchGroupTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeSoqlFunctionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFunctionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFunctionType),
        construct: (queryTypeClass: SoqlFunctionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const func = assignMultiClass(queryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
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
                        const value = values.forEach((v, index) => {
                            const valueSourceInfo = makeEmptySourceInfoMap();
                            const value = assignMultiClass(v, [
                                {
                                    isValid: (target: unknown): target is string =>
                                        typeof target === 'string',
                                    construct: (value: string) => {
                                        valueSourceInfo['string'] = value;
                                        return value;
                                    },
                                },
                                makeLocationValueRule(valueSourceInfo, errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]);
                            nestedSourceInfo[`${queryTypeClass.getType()}_${index}`] =
                                valueSourceInfo;
                            return value;
                        });
                    },
                },
                makeFieldNameRule(nestedSourceInfo, errorInfo),
                makeDateFieldNameRule(nestedSourceInfo, errorInfo),
                makeSoqlFieldsParameterRule(nestedSourceInfo, errorInfo),
                makeSoqlFunctionRule(nestedSourceInfo, errorInfo),
            ]);
            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return { func, param };
        },
    };
};

export const makeSubQueryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubQueryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubQueryType),
        construct: (queryTypeClass: SubQueryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const select = assignMultiClass(queryTypeClass.getValue(), [
                makeSelectListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const from = assignMultiClass(queryTypeClass.getFrom(), [
                makeFromNameListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const where = assignMultiClass(queryTypeClass.getWhereClause(), [
                makeWhereClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const orderBy = assignMultiClass(queryTypeClass.getOrderByClause(), [
                makeOrderByClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const forClause = assignMultiClass(queryTypeClass.getForClause(), [
                makeForClausesRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const limit = assignMultiClass(queryTypeClass.getLimitClause(), [
                makeLimitClauseRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const update = assignMultiClass(queryTypeClass.getUpdateList(), [
                makeUpdateListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            sourceInfo[queryTypeClass.getType()] = nestedSourceInfo;
            return {
                select,
                from,
                where,
                orderBy,
                limit,
                update,
                forClause,
            };
        },
    };
};
