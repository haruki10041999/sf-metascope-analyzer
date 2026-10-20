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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
    sourceList,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeIdRule, IdType } from './id';

export type ArrayInitializerType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isArrayInitializerType = typia.createIs<ArrayInitializerType>();

export const makeArrayInitializerRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayInitializerTypeClass, ArrayInitializerType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayInitializerTypeClass),
        construct: (variableTypeClass: ArrayInitializerTypeClass) => {
            const node = makeSourceNode(variableTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = variableTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: variableTypeClass.getType(), value };
        },
    };
};

export type VariableDeclaratorsType = {
    type: string;
    value: ValueRuleValue<VariableDeclaratorType>[];
};

export const isVariableDeclaratorsType = typia.createIs<VariableDeclaratorsType>();

export const makeVariableDeclaratorsRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<VariableDeclaratorsTypeClass, VariableDeclaratorsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorsTypeClass),
        construct: (variableTypeClass: VariableDeclaratorsTypeClass) => {
            const node = makeSourceNode(variableTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = variableTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeVariableDeclaratorRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: variableTypeClass.getType(), value };
        },
    };
};

export type VariableDeclaratorType = {
    type: string;
    value: ValueRuleValue<IdType>;
    init: ValueRuleValue<BaseExpressionType>;
};

export const isVariableDeclaratorType = typia.createIs<VariableDeclaratorType>();

export const makeVariableDeclaratorRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<VariableDeclaratorTypeClass, VariableDeclaratorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorTypeClass),
        construct: (variableTypeClass: VariableDeclaratorTypeClass) => {
            const node = makeSourceNode(variableTypeClass);
            const value = assignMultiClass(variableTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const init = assignMultiClass(variableTypeClass.getContent(), [
                ...makeBaseExpressionRule(sourceField(node, 'init'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: variableTypeClass.getType(), value, init };
        },
    };
};

