import {
    ArrayInitializerTypeClass,
    VariableDeclaratorsTypeClass,
    VariableDeclaratorTypeClass,
    VariableListTypeClass,
    VariableTypeClass,
    isArrayInitializerType,
    isVariableDeclaratorsType,
    isVariableDeclaratorType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeBaseExpressionRule } from './expression';
import { makeIdRule } from './id';

export const makeArrayInitializerRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayInitializerTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayInitializerType),
        construct: (variableTypeClass: ArrayInitializerTypeClass) => {
            const variable = variableTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${variableTypeClass.getType()}_${index}`] = nestedSourceInfo;
                return value;
            });
            return variable;
        },
    };
};

export const makeVariableDeclaratorsRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<VariableDeclaratorsTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorsType),
        construct: (variableTypeClass: VariableDeclaratorsTypeClass) => {
            const variable = variableTypeClass.getValue().map((v, index) => {
                const nestedSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeVariableDeclaratorRule(nestedSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                sourceInfo[`${variableTypeClass.getType()}_${index}`] = nestedSourceInfo;
                return value;
            });
            return variable;
        },
    };
};

export const makeVariableDeclaratorRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<VariableDeclaratorTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isVariableDeclaratorType),
        construct: (variableTypeClass: VariableDeclaratorTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const variant = assignMultiClass(variableTypeClass.getValue(), [
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const init = assignMultiClass(variableTypeClass.getContent(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[variableTypeClass.getType()] = nestedSourceInfo;
        },
    };
};
