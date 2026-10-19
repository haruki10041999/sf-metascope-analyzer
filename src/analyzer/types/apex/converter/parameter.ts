import {
    FormalParametersTypeClass,
    FormalParameterTypeClass,
    ParameterTypeClass,
    SoqlFieldsParameterTypeClass,
    isFormalParametersType,
    isFormalParameterType,
    isSoqlFieldsParameterType,
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
import { makeIdRule } from './id';
import { makeFormalParameterListRule } from './list';
import { makeModifierRule } from './modifier';
import { makeTypeRefRule } from './type';

export const makeFormalParametersRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParametersTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParametersType),
        construct: (parameterTypeClass: FormalParametersTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                makeFormalParameterListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[parameterTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeFormalParameterRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParameterTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterType),
        construct: (parameterTypeClass: FormalParameterTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const variant = assignMultiClass(parameterTypeClass.getValue(), [
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const variantType = assignMultiClass(parameterTypeClass.getValueType(), [
                makeTypeRefRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifier = parameterTypeClass.getModifier().forEach((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeModifierRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[parameterTypeClass.getType()] = valueSourceInfo;
                return value;
            });

            sourceInfo[parameterTypeClass.getType()] = nestedSourceInfo;
            return { variant, variantType, modifier };
        },
    };
};

export const makeSoqlFieldsParameterRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFieldsParameterTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFieldsParameterType),
        construct: (parameterTypeClass: SoqlFieldsParameterTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[parameterTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};
