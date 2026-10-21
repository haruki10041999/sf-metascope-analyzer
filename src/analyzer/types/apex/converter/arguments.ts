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
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeExpressionListRule, makeTypeListRule, ExpressionListType, TypeListType } from './list';

export type ArgumentsType = CommonType & {
    value: ValueRuleValue<ExpressionListType | null>;
};

export const isArgumentsType = typia.createIs<ArgumentsType>();

export const makeArgumentsRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalArgumentsTypeClass, ArgumentsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalArgumentsType),
        construct: (argumentsTypeClass: NormalArgumentsTypeClass) => {
            const value = assignMultiClass(argumentsTypeClass.getValue(), [
                makeExpressionListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);

            return {
                type: argumentsTypeClass.getType(),
                sourceInfo: makeSourceInfo(argumentsTypeClass),
                value,
            };
        },
    };
};

export type TypeArgumentsType = CommonType & {
    value: ValueRuleValue<TypeListType | null>;
};

export const isTypeArgumentsType = typia.createIs<TypeArgumentsType>();

export const makeTypeArgumentsRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeArgumentsTypeClass, TypeArgumentsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeArgumentsTypeClass),
        construct: (argumentsTypeClass: TypeArgumentsTypeClass) => {
            const value = assignMultiClass(argumentsTypeClass.getValue(), [
                makeTypeListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: argumentsTypeClass.getType(),
                sourceInfo: makeSourceInfo(argumentsTypeClass),
                value,
            };
        },
    };
};

