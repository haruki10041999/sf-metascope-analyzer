import {
    ExpressionListTypeClass,
    FieldGroupByListTypeClass,
    FieldListTypeClass,
    FieldNameListTypeClass,
    FieldOrderListTypeClass,
    FieldSpecListTypeClass,
    FormalParameterListTypeClass,
    FromNameListTypeClass,
    FromNameTypeClass,
    ListTypeClass,
    NetworkListTypeClass,
    SelectListTypeClass,
    SoslFieldTypeClass,
    SubFieldListTypeClass,
    TypeListTypeClass,
    UpdateListTypeClass,
    ValueListTypeClass,
    isExpressionListType,
    isFieldGroupByListType,
    isFieldListType,
    isFieldNameListType,
    isFieldOrderListType,
    isFieldSpecListType,
    isFormalParameterListType,
    isFromNameListType,
    isFromNameType,
    isNetworkListType,
    isSelectListType,
    isSoslFieldType,
    isSubFieldListType,
    isTypeListType,
    isUpdateListType,
    isValueListType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    makeEmptySourceInfoMap,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeBaseExpressionRule } from './expression';

export const makeExpressionListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ExpressionListTypeClass, unknown[]> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isExpressionListType),
        construct: (listTypeClass: ExpressionListTypeClass) => {
            const listSourceInfo = makeEmptySourceInfoMap();
            const expressionList = listTypeClass.getValue().map((v, index) => {
                const value = assignMultiClass(v, [
                    ...makeBaseExpressionRule(listSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${listTypeClass.getValue}_${index}`] = listSourceInfo;
                return value;
            });
            return expressionList;
        },
    };
};

export const makeFieldGroupByListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldGroupByListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByListType),
        construct: (_typeClass: FieldGroupByListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldListType),
        construct: (_typeClass: FieldListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldNameListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldNameListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameListType),
        construct: (_typeClass: FieldNameListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldOrderListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldOrderListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderListType),
        construct: (_typeClass: FieldOrderListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldSpecListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldSpecListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecListType),
        construct: (_typeClass: FieldSpecListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFormalParameterListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParameterListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterListType),
        construct: (_typeClass: FormalParameterListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFromNameListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FromNameListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFromNameListType),
        construct: (_typeClass: FromNameListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFromNameRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FromNameTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFromNameType),
        construct: (_typeClass: FromNameTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeNetworkListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NetworkListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNetworkListType),
        construct: (_typeClass: NetworkListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSelectListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SelectListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectListType),
        construct: (_typeClass: SelectListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSoslFieldRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslFieldTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslFieldType),
        construct: (_typeClass: SoslFieldTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSubFieldListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubFieldListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldListType),
        construct: (_typeClass: SubFieldListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeTypeListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeListType),
        construct: (_typeClass: TypeListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeUpdateListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateListType),
        construct: (_typeClass: UpdateListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeValueListRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ValueListTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isValueListType),
        construct: (_typeClass: ValueListTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
