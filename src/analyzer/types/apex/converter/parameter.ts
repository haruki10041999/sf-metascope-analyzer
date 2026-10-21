import typia from 'typia';

import {
    FormalParametersTypeClass,
    FormalParameterTypeClass,
    SoqlFieldsParameterTypeClass,
    isFormalParametersType as isFormalParametersTypeClass,
    isFormalParameterType as isFormalParameterTypeClass,
    isSoqlFieldsParameterType as isSoqlFieldsParameterTypeClass,
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
    makeStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeIdRule, IdType } from './id';
import { makeFormalParameterListRule, FormalParameterListType } from './list';
import { makeModifierRule, ModifierType } from './modifier';
import { makeTypeRefRule, TypeRefType } from './type';

export type FormalParametersType = CommonType & {
    value: ValueRuleValue<FormalParameterListType | null>;
};

export const isFormalParametersType = typia.createIs<FormalParametersType>();

export const makeFormalParametersRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParametersTypeClass, FormalParametersType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParametersTypeClass),
        construct: (parameterTypeClass: FormalParametersTypeClass) => {
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                makeFormalParameterListRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: parameterTypeClass.getType(),
                sourceInfo: makeSourceInfo(parameterTypeClass),
                value,
            };
        },
    };
};

export type FormalParameterType = CommonType & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isFormalParameterType = typia.createIs<FormalParameterType>();

export const makeFormalParameterRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParameterTypeClass, FormalParameterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterTypeClass),
        construct: (parameterTypeClass: FormalParameterTypeClass) => {
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = assignMultiClass(parameterTypeClass.getValueType(), [
                makeTypeRefRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifier = parameterTypeClass
                .getModifier()
                .map((v) =>
                    assignMultiClass(v, [
                        makeModifierRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            return {
                type: parameterTypeClass.getType(),
                sourceInfo: makeSourceInfo(parameterTypeClass),
                value,
                valueType,
                modifier,
            };
        },
    };
};

export type SoqlFieldsParameterType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isSoqlFieldsParameterType = typia.createIs<SoqlFieldsParameterType>();

export const makeSoqlFieldsParameterRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFieldsParameterTypeClass, SoqlFieldsParameterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFieldsParameterTypeClass),
        construct: (parameterTypeClass: SoqlFieldsParameterTypeClass) => {
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: parameterTypeClass.getType(),
                sourceInfo: makeSourceInfo(parameterTypeClass),
                value,
            };
        },
    };
};

