import typia from 'typia';

import {
    DotMethodCallTypeClass,
    MethodCallTypeClass,
    isDotMethodCallType as isDotMethodCallTypeClass,
    isMethodCallType as isMethodCallTypeClass,
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
} from './commons';
import { makeAnyIdRule, makeIdRule, AnyIdType, IdType } from './id';
import { makeExpressionListRule, ExpressionListType } from './list';

export type DotMethodCallType = {
    type: string;
    value: ValueRuleValue<AnyIdType>;
    param: ValueRuleValue<ExpressionListType>;
};

export const isDotMethodCallType = typia.createIs<DotMethodCallType>();

export const makeDotMethodCallRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DotMethodCallTypeClass, DotMethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotMethodCallTypeClass),
        construct: (callTypeClass: DotMethodCallTypeClass) => {
            const node = makeSourceNode(callTypeClass);
            const value = assignMultiClass(callTypeClass.getValue(), [
                makeAnyIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: callTypeClass.getType(), value, param };
        },
    };
};

export type MethodCallType = {
    type: string;
    value: ValueRuleValue<IdType>;
    param: ValueRuleValue<ExpressionListType>;
    reference: string | null;
};

export const isMethodCallType = typia.createIs<MethodCallType>();

export const makeMethodCallRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MethodCallTypeClass, MethodCallType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallTypeClass),
        construct: (callTypeClass: MethodCallTypeClass) => {
            const node = makeSourceNode(callTypeClass);
            const value = assignMultiClass(callTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const param = assignMultiClass(callTypeClass.getParam(), [
                makeExpressionListRule(sourceField(node, 'param'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const reference = callTypeClass.getReference();
            slot(node);
            return { type: callTypeClass.getType(), value, param, reference };
        },
    };
};

