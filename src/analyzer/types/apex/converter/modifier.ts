import typia from 'typia';

import {
    AnnotationTypeClass,
    NormalModifierTypeClass,
    isAnnotationType as isAnnotationTypeClass,
    isNormalModifierType,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeStringAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeIdRule, IdType } from './id';
import { makeElementValueRule, ElementValueType } from './value';
import { makeElementValuePairsRule, ElementValuePairsType } from './pair';

export type AnnotationType = CommonType & {
    value: ValueRuleValue<IdType>;
    param: ValueRuleValue<ElementValueType | ElementValuePairsType | null>;
};

export const isAnnotationType = typia.createIs<AnnotationType>();

export const makeAnnotationRule = (): AssignForValueRule<AnnotationTypeClass, AnnotationType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnnotationTypeClass),
        construct: (modifierTypeClass: AnnotationTypeClass) => {
            const value = assignMultiClass(modifierTypeClass.getValue(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);
            const param = assignMultiClass(modifierTypeClass.getParam(), [
                makeElementValueRule(),
                makeElementValuePairsRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            return {
                type: modifierTypeClass.getType(),
                sourceInfo: makeSourceInfo(modifierTypeClass),
                value,
                param,
            };
        },
    };
};

export type ModifierType = CommonType & {
    value: ValueRuleValue<string | AnnotationType>;
};

export const isModifierType = typia.createIs<ModifierType>();

export const makeModifierRule = (): AssignForValueRule<NormalModifierTypeClass, ModifierType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalModifierType),
        construct: (modifierTypeClass: NormalModifierTypeClass) => {
            const value = assignMultiClass(modifierTypeClass.getValue(), [
                makeStringAssignRule,
                makeAnnotationRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: modifierTypeClass.getType(),
                sourceInfo: makeSourceInfo(modifierTypeClass),
                value,
            };
        },
    };
};

