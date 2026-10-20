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
import { makeIdRule, IdType } from './id';
import { makeFormalParameterListRule, FormalParameterListType } from './list';
import { makeModifierRule, ModifierType } from './modifier';
import { makeTypeRefRule, TypeRefType } from './type';

export type FormalParametersType = {
    type: string;
    value: ValueRuleValue<FormalParameterListType>;
};

export const isFormalParametersType = typia.createIs<FormalParametersType>();

export const makeFormalParametersRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParametersTypeClass, FormalParametersType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParametersTypeClass),
        construct: (parameterTypeClass: FormalParametersTypeClass) => {
            const node = makeSourceNode(parameterTypeClass);
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                makeFormalParameterListRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: parameterTypeClass.getType(), value };
        },
    };
};

export type FormalParameterType = {
    type: string;
    value: ValueRuleValue<IdType>;
    valueType: ValueRuleValue<TypeRefType>;
    modifier: ValueRuleValue<ModifierType>[];
};

export const isFormalParameterType = typia.createIs<FormalParameterType>();

export const makeFormalParameterRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParameterTypeClass, FormalParameterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterTypeClass),
        construct: (parameterTypeClass: FormalParameterTypeClass) => {
            const node = makeSourceNode(parameterTypeClass);
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = assignMultiClass(parameterTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const modifierSource = sourceList(node, 'modifier');
            const modifier = parameterTypeClass
                .getModifier()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeModifierRule(modifierSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );

            slot(node);
            return { type: parameterTypeClass.getType(), value, valueType, modifier };
        },
    };
};

export type SoqlFieldsParameterType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isSoqlFieldsParameterType = typia.createIs<SoqlFieldsParameterType>();

export const makeSoqlFieldsParameterRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlFieldsParameterTypeClass, SoqlFieldsParameterType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlFieldsParameterTypeClass),
        construct: (parameterTypeClass: SoqlFieldsParameterTypeClass) => {
            const value = assignMultiClass(parameterTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(parameterTypeClass));
            return { type: parameterTypeClass.getType(), value };
        },
    };
};

