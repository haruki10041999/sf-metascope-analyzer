import typia from 'typia';

import {
    AnnotationTypeClass,
    NormalModifierTypeClass,
    isAnnotationType as isAnnotationTypeClass,
    isNormalModifierType,
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
import { makeIdRule, IdType } from './id';
import { makeElementValueRule, ElementValueType } from './value';
import { makeElementValuePairsRule, ElementValuePairsType } from './pair';

export type AnnotationType = {
    type: string;
    value: ValueRuleValue<IdType>;
    param: ValueRuleValue<ElementValueType | ElementValuePairsType>;
};

export const isAnnotationType = typia.createIs<AnnotationType>();

export const makeAnnotationRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AnnotationTypeClass, AnnotationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnnotationTypeClass),
        construct: (modifierTypeClass: AnnotationTypeClass) => {
            const node = makeSourceNode(modifierTypeClass);
            const value = assignMultiClass(modifierTypeClass.getValue(), [
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const paramSource = sourceField(node, 'param');
            const param = assignMultiClass(modifierTypeClass.getParam(), [
                makeElementValueRule(paramSource, errorInfo),
                makeElementValuePairsRule(paramSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            slot(node);
            return { type: modifierTypeClass.getType(), value, param };
        },
    };
};

export type ModifierType = {
    type: string;
    value: ValueRuleValue<string | AnnotationType>;
};

export const isModifierType = typia.createIs<ModifierType>();

export const makeModifierRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalModifierTypeClass, ModifierType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalModifierType),
        construct: (modifierTypeClass: NormalModifierTypeClass) => {
            const node = makeSourceNode(modifierTypeClass);
            const value = assignMultiClass(modifierTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeAnnotationRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: modifierTypeClass.getType(), value };
        },
    };
};

