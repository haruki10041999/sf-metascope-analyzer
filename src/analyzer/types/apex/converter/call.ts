import typia from 'typia';

import {
    DotMethodCallTypeClass,
    MethodCallTypeClass,
    isDotMethodCallType as isDotMethodCallTypeClass,
    isMethodCallType as isMethodCallTypeClass,
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
} from './commons';
import { makeAnyIdRule, makeIdRule, AnyIdType, IdType } from './id';
import { makeExpressionListRule, ExpressionListType } from './list';

export type DotMethodCallType = CommonType & {
    value: ValueRuleValue<AnyIdType>;
    param: ValueRuleValue<ExpressionListType | null>;
};

export const isDotMethodCallType = typia.createIs<DotMethodCallType>();

export const makeDotMethodCallRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DotMethodCallTypeClass, DotMethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotMethodCallTypeClass),
        construct: (callTypeClass: DotMethodCallTypeClass) => {
            const value = assignMultiClass(callTypeClass.getValue(), [
                makeAnyIdRule(),
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: callTypeClass.getType(),
                sourceInfo: makeSourceInfo(callTypeClass),
                value,
                param,
            };
        },
    };
};

export type MethodCallType = CommonType & {
    value: ValueRuleValue<IdType | null>;
    param: ValueRuleValue<ExpressionListType | null>;
    reference: string | null;
};

export const isMethodCallType = typia.createIs<MethodCallType>();

export const makeMethodCallRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<MethodCallTypeClass, MethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallTypeClass),
        construct: (callTypeClass: MethodCallTypeClass) => {
            const value = assignMultiClass(callTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const reference = callTypeClass.getReference();
            return {
                type: callTypeClass.getType(),
                sourceInfo: makeSourceInfo(callTypeClass),
                value,
                param,
                reference,
            };
        },
    };
};

