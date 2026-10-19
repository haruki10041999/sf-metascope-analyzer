import {
    ArgumentsTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    isNormalArgumentsType,
    isTypeArgumentsType,
} from '../../apex_IR';

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
import { makeExpressionListRule, makeTypeListRule } from './list';

export const makeArgumentsRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalArgumentsTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalArgumentsType),
        construct: (arugmentsTypeClass: NormalArgumentsTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(arugmentsTypeClass.getValue(), [
                makeExpressionListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            sourceInfo[arugmentsTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeTypeArgumentsRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeArgumentsTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeArgumentsType),
        construct: (arugmentsTypeClass: TypeArgumentsTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(arugmentsTypeClass.getValue(), [
                makeTypeListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[arugmentsTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};
