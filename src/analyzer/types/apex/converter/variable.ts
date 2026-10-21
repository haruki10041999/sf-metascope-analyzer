import typia from 'typia';

import {
    ArrayInitializerTypeClass,
    VariableDeclaratorsTypeClass,
    VariableDeclaratorTypeClass,
    isArrayInitializerType as isArrayInitializerTypeClass,
    isVariableDeclaratorsType as isVariableDeclaratorsTypeClass,
    isVariableDeclaratorType as isVariableDeclaratorTypeClass,
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
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeIdRule, IdType } from './id';

export type ArrayInitializerType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isArrayInitializerType = typia.createIs<ArrayInitializerType>();

export const makeArrayInitializerRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayInitializerTypeClass, ArrayInitializerType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayInitializerTypeClass),
        construct: (variableTypeClass: ArrayInitializerTypeClass) => {
            const value = variableTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: variableTypeClass.getType(),
                sourceInfo: makeSourceInfo(variableTypeClass),
                value,
            };
        },
    };
};

export type VariableDeclaratorsType = CommonType & {
    value: ValueRuleValue<VariableDeclaratorType>[];
};

export const isVariableDeclaratorsType = typia.createIs<VariableDeclaratorsType>();

export const makeVariableDeclaratorsRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<VariableDeclaratorsTypeClass, VariableDeclaratorsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorsTypeClass),
        construct: (variableTypeClass: VariableDeclaratorsTypeClass) => {
            const value = variableTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeVariableDeclaratorRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: variableTypeClass.getType(),
                sourceInfo: makeSourceInfo(variableTypeClass),
                value,
            };
        },
    };
};

export type VariableDeclaratorType = CommonType & {
    value: ValueRuleValue<IdType>;
    init: ValueRuleValue<BaseExpressionType | null>;
};

export const isVariableDeclaratorType = typia.createIs<VariableDeclaratorType>();

export const makeVariableDeclaratorRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<VariableDeclaratorTypeClass, VariableDeclaratorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorTypeClass),
        construct: (variableTypeClass: VariableDeclaratorTypeClass) => {
            const value = assignMultiClass(variableTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule(errorInfo),
            ]);
            const init = assignMultiClass(variableTypeClass.getContent(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: variableTypeClass.getType(),
                sourceInfo: makeSourceInfo(variableTypeClass),
                value,
                init,
            };
        },
    };
};

