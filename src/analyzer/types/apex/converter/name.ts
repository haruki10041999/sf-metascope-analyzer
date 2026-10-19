import {
    CreatedNameTypeClass,
    DataCategoryNameTypeClass,
    DateFieldNameTypeClass,
    FieldNameTypeClass,
    NameListTypeClass,
    NameTypeClass,
    QualifiedNameTypeClass,
    TypeNameTypeClass,
    isCreatedNameType,
    isDataCategoryNameType,
    isDateFieldNameType,
    isFieldNameType,
    isQualifiedNameType,
    isTypeNameType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
} from './commons';

export const makeCreatedNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CreatedNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatedNameType),
        construct: (_typeClass: CreatedNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeDataCategoryNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DataCategoryNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategoryNameType),
        construct: (_typeClass: DataCategoryNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeDateFieldNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFieldNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFieldNameType),
        construct: (_typeClass: DateFieldNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameType),
        construct: (_typeClass: FieldNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeQualifiedNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<QualifiedNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isQualifiedNameType),
        construct: (_typeClass: QualifiedNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeTypeNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameType),
        construct: (_typeClass: TypeNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
