import {
    ArrayInitializerTypeClass,
    VariableDeclaratorsTypeClass,
    VariableDeclaratorTypeClass,
    isArrayInitializerType as isArrayInitializerTypeClass,
    isVariableDeclaratorsType as isVariableDeclaratorsTypeClass,
    isVariableDeclaratorType as isVariableDeclaratorTypeClass,
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
import { makeBaseExpressionAssignRules, BaseExpressionType } from './expression';
import { makeIdAssignRule, IdType } from './id';

export type ArrayInitializerType = CommonType<'arrayInitializer'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isArrayInitializerType = (value: unknown): value is ArrayInitializerType => {
    return isCommonType(value) && value.type === 'arrayInitializer';
};

export const makeArrayInitializerAssignRule: AssignForValueRule<
    ArrayInitializerTypeClass,
    ArrayInitializerType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isArrayInitializerTypeClass),
    construct: (variableTypeClass: ArrayInitializerTypeClass) => {
        const value = variableTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [...makeBaseExpressionAssignRules, makeErrorAssignRule]),
            );
        return {
            type: variableTypeClass.getType(),
            sourceInfo: makeSourceInfo(variableTypeClass),
            value,
        };
    },
};

export type VariableDeclaratorsType = CommonType<'variableDeclarators'> & {
    value: ValueRuleValue<VariableDeclaratorType>[];
};

export const isVariableDeclaratorsType = (value: unknown): value is VariableDeclaratorsType => {
    return isCommonType(value) && value.type === 'variableDeclarators';
};

export const makeVariableDeclaratorsAssignRule: AssignForValueRule<
    VariableDeclaratorsTypeClass,
    VariableDeclaratorsType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorsTypeClass),
    construct: (variableTypeClass: VariableDeclaratorsTypeClass) => {
        const value = variableTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeVariableDeclaratorAssignRule, makeErrorAssignRule]),
            );
        return {
            type: variableTypeClass.getType(),
            sourceInfo: makeSourceInfo(variableTypeClass),
            value,
        };
    },
};

export type VariableDeclaratorType = CommonType<'variableDeclarator'> & {
    value: ValueRuleValue<IdType>;
    init: ValueRuleValue<BaseExpressionType | null>;
};

export const isVariableDeclaratorType = (value: unknown): value is VariableDeclaratorType => {
    return isCommonType(value) && value.type === 'variableDeclarator';
};

export const makeVariableDeclaratorAssignRule: AssignForValueRule<
    VariableDeclaratorTypeClass,
    VariableDeclaratorType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorTypeClass),
    construct: (variableTypeClass: VariableDeclaratorTypeClass) => {
        const value = assignMultiClass(variableTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const init = assignMultiClass(variableTypeClass.getContent(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
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
