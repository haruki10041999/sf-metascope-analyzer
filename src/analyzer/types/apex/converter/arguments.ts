import typia from 'typia';

import {
    ArgumentsTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    isNormalArgumentsType,
    isTypeArgumentsType as isTypeArgumentsTypeClass,
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
import { makeExpressionListRule, makeTypeListRule, ExpressionListType, TypeListType } from './list';

export type ArgumentsType = {
    type: string;
    value: ValueRuleValue<ExpressionListType>;
};

export const isArgumentsType = typia.createIs<ArgumentsType>();

export const makeArgumentsRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalArgumentsTypeClass, ArgumentsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalArgumentsType),
        construct: (argumentsTypeClass: NormalArgumentsTypeClass) => {
            const node = makeSourceNode(argumentsTypeClass);
            const value = assignMultiClass(argumentsTypeClass.getValue(), [
                makeExpressionListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: argumentsTypeClass.getType(), value };
        },
    };
};

export type TypeArgumentsType = {
    type: string;
    value: ValueRuleValue<TypeListType>;
};

export const isTypeArgumentsType = typia.createIs<TypeArgumentsType>();

export const makeTypeArgumentsRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeArgumentsTypeClass, TypeArgumentsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeArgumentsTypeClass),
        construct: (argumentsTypeClass: TypeArgumentsTypeClass) => {
            const node = makeSourceNode(argumentsTypeClass);
            const value = assignMultiClass(argumentsTypeClass.getValue(), [
                makeTypeListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: argumentsTypeClass.getType(), value };
        },
    };
};

