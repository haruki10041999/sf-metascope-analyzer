import {
    DotMethodCallTypeClass,
    MethodCallTypeClass,
    isDotMethodCallType as isDotMethodCallTypeClass,
    isMethodCallType as isMethodCallTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeAnyIdAssignRule, makeIdAssignRule, AnyIdType, IdType } from './id';
import { makeExpressionListAssignRule, ExpressionListType } from './list';

export type DotMethodCallType = CommonType<'dotMethodCall'> & {
    value: ValueRuleValue<AnyIdType>;
    param: ValueRuleValue<ExpressionListType | null>;
};

export const isDotMethodCallType = (value: unknown): value is DotMethodCallType => {
    return isCommonType(value) && value.type === 'dotMethodCall';
};

export const makeDotMethodCallAssignRule: AssignForValueRule<
    DotMethodCallTypeClass,
    DotMethodCallType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDotMethodCallTypeClass),
    construct: (callTypeClass: DotMethodCallTypeClass) => {
        const value = assignMultiClass(callTypeClass.getValue(), [
            makeAnyIdAssignRule,
            makeErrorAssignRule,
        ]);
        const param = assignMultiClass(callTypeClass.getParam(), [
            makeExpressionListAssignRule,
            makeErrorAssignRule,
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

export type MethodCallType = CommonType<'methodCall'> & {
    value: ValueRuleValue<IdType | null>;
    param: ValueRuleValue<ExpressionListType | null>;
    reference: string | null;
};

export const isMethodCallType = (value: unknown): value is MethodCallType => {
    return isCommonType(value) && value.type === 'methodCall';
};

export const makeMethodCallAssignRule: AssignForValueRule<MethodCallTypeClass, MethodCallType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallTypeClass),
    construct: (callTypeClass: MethodCallTypeClass) => {
        const value = assignMultiClass(callTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const param = assignMultiClass(callTypeClass.getParam(), [
            makeExpressionListAssignRule,
            makeErrorAssignRule,
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
