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

export const makeDotMethodCallRule = (): AssignForValueRule<
    DotMethodCallTypeClass,
    DotMethodCallType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotMethodCallTypeClass),
        construct: (callTypeClass: DotMethodCallTypeClass) => {
            const value = assignMultiClass(callTypeClass.getValue(), [
                makeAnyIdRule(),
                makeErrorAssignRule,
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(),
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
};

export type MethodCallType = CommonType & {
    value: ValueRuleValue<IdType | null>;
    param: ValueRuleValue<ExpressionListType | null>;
    reference: string | null;
};

export const isMethodCallType = typia.createIs<MethodCallType>();

export const makeMethodCallRule = (): AssignForValueRule<MethodCallTypeClass, MethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallTypeClass),
        construct: (callTypeClass: MethodCallTypeClass) => {
            const value = assignMultiClass(callTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(),
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
};

