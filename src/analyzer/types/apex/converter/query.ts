import {
    ComparisonOperatorTypeClass,
    DateFormulaTypeClass,
    FieldSpecTypeClass,
    NormalQueryTypeClass,
    QueryTypeClass,
    SearchGroupTypeClass,
    SoqlFunctionTypeClass,
    SoqlQueryTypeClass,
    SubQueryTypeClass,
    isComparisonOperatorType,
    isDateFormulaType,
    isFieldSpecType,
    isNormalQueryType,
    isSearchGroupType,
    isSoqlFunctionType,
    isSubQueryType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
} from './commons';

export const makeComparisonOperatorRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ComparisonOperatorTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isComparisonOperatorType),
        construct: (_typeClass: ComparisonOperatorTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeDateFormulaRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFormulaTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFormulaType),
        construct: (_typeClass: DateFormulaTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldSpecRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldSpecTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecType),
        construct: (_typeClass: FieldSpecTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeQueryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalQueryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalQueryType),
        construct: (_typeClass: NormalQueryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSearchGroupRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SearchGroupTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSearchGroupType),
        construct: (_typeClass: SearchGroupTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSoqlFunctionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFunctionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFunctionType),
        construct: (_typeClass: SoqlFunctionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSubQueryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubQueryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubQueryType),
        construct: (_typeClass: SubQueryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
