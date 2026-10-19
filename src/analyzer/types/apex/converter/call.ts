import typia from 'typia';

import {
    CallTypeClass,
    DotMethodCallTypeClass,
    MethodCallTypeClass,
    isDotMethodCallType,
    isMethodCallType,
    isErrorType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    makeEmptySourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeAnyIdRule, makeIdRule } from './id';
import { makeExpressionListRule } from './list';

export type DotMethodCallType = {
    member: ValueRuleValue<string>;
    param: ValueRuleValue<ValueRuleValue<unknown>[]>;
};

export const makeDotMethodCallRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DotMethodCallTypeClass, DotMethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotMethodCallType),
        construct: (callTypeClass: DotMethodCallTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const member = assignMultiClass(callTypeClass.getValue(), [
                makeAnyIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const paramTypeClass = callTypeClass.getParam();
            let param: unknown[] | null = null;
            if (paramTypeClass && isErrorType(paramTypeClass)) {
                makeErrorAssignRule(errorInfo).construct(paramTypeClass);
            } else if (paramTypeClass) {
                param = makeExpressionListRule(nestedSourceInfo, errorInfo).construct(
                    paramTypeClass,
                );
            }
            sourceInfo[callTypeClass.getType()] = nestedSourceInfo;

            return {
                member,
                param,
            };
        },
    };
};

export type MethodCallType = {
    member: ValueRuleValue<string>;
    param: ValueRuleValue<ValueRuleValue<unknown>[]>;
    reference: string | null;
};

export const makeMethodCallRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MethodCallTypeClass, MethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallType),
        construct: (callTypeClass: MethodCallTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const member = assignMultiClass(callTypeClass.getValue(), [
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const reference = callTypeClass.getReference();
            sourceInfo[callTypeClass.getType()] = nestedSourceInfo;
            return { member, param, reference };
        },
    };
};
