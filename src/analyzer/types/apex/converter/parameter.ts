import {
    FormalParametersTypeClass,
    FormalParameterTypeClass,
    SoqlFieldsParameterTypeClass,
    isFormalParametersType as isFormalParametersTypeClass,
    isFormalParameterType as isFormalParameterTypeClass,
    isSoqlFieldsParameterType as isSoqlFieldsParameterTypeClass,
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
    makeStringAssignRule,
    makeLimitedStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeIdAssignRule, IdType } from './id';
import { makeFormalParameterListAssignRule, FormalParameterListType } from './list';
import { makeModifierAssignRule, ModifierType } from './modifier';
import { makeTypeRefAssignRule, TypeRefType } from './type';

export type FormalParametersType = CommonType<'formalParameters'> & {
    value: ValueRuleValue<FormalParameterListType | null>;
};

export const isFormalParametersType = (value: unknown): value is FormalParametersType => {
    return isCommonType(value) && value.type === 'formalParameters';
};

export const makeFormalParametersAssignRule: AssignForValueRule<
    FormalParametersTypeClass,
    FormalParametersType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFormalParametersTypeClass),
    construct: (parameterTypeClass: FormalParametersTypeClass) => {
        const value = assignMultiClass(parameterTypeClass.getValue(), [
            makeFormalParameterListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: parameterTypeClass.getType(),
            sourceInfo: makeSourceInfo(parameterTypeClass),
            value,
        };
    },
};

export type FormalParameterType = CommonType<'formalParameter'> & {
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isFormalParameterType = (value: unknown): value is FormalParameterType => {
    return isCommonType(value) && value.type === 'formalParameter';
};

export const makeFormalParameterAssignRule: AssignForValueRule<
    FormalParameterTypeClass,
    FormalParameterType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterTypeClass),
    construct: (parameterTypeClass: FormalParameterTypeClass) => {
        const value = assignMultiClass(parameterTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const valueType = assignMultiClass(parameterTypeClass.getValueType(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);
        const modifier = parameterTypeClass
            .getModifier()
            .map((v) => assignMultiClass(v, [makeModifierAssignRule, makeErrorAssignRule]));

        return {
            type: parameterTypeClass.getType(),
            sourceInfo: makeSourceInfo(parameterTypeClass),
            value,
            valueType,
            modifier,
        };
    },
};

export type SoqlFieldsParameterType = CommonType<'soqlFieldsParameter'> & {
    value: 'ALL' | 'CUSTOM' | 'STANDARD';
};

export const isSoqlFieldsParameterType = (value: unknown): value is SoqlFieldsParameterType => {
    return isCommonType(value) && value.type === 'soqlFieldsParameter';
};

export const makeSoqlFieldsParameterAssignRule: AssignForValueRule<
    SoqlFieldsParameterTypeClass,
    SoqlFieldsParameterType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFieldsParameterTypeClass),
    construct: (parameterTypeClass: SoqlFieldsParameterTypeClass) => {
        return {
            type: parameterTypeClass.getType(),
            sourceInfo: makeSourceInfo(parameterTypeClass),
            value: parameterTypeClass.getValue(),
        };
    },
};
