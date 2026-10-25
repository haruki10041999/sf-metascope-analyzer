import {
    AnnotationTypeClass,
    NormalModifierTypeClass,
    isAnnotationType as isAnnotationTypeClass,
    isNormalModifierType,
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
    makeStringAssignRule,
    makeNullAssignRule,
    makeLimitedStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeIdAssignRule, IdType } from './id';
import { makeElementValueAssignRule, ElementValueType } from './value';
import { makeElementValuePairsAssignRule, ElementValuePairsType } from './pair';

export type AnnotationType = CommonType<'annotation'> & {
    value: ValueRuleValue<IdType>;
    param: ValueRuleValue<ElementValueType | ElementValuePairsType | null>;
};

export const isAnnotationType = (value: unknown): value is AnnotationType => {
    return isCommonType(value) && value.type === 'annotation';
};

export const makeAnnotationAssignRule: AssignForValueRule<AnnotationTypeClass, AnnotationType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isAnnotationTypeClass),
    construct: (modifierTypeClass: AnnotationTypeClass) => {
        const value = assignMultiClass(modifierTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const param = assignMultiClass(modifierTypeClass.getParam(), [
            makeElementValueAssignRule,
            makeElementValuePairsAssignRule,
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

export type ModifierType = CommonType<'modifier'> &
    (
        | {
              value:
                  | 'GLOBAL'
                  | 'PUBLIC'
                  | 'PROTECTED'
                  | 'PRIVATE'
                  | 'TRANSIENT'
                  | 'STATIC'
                  | 'ABSTRACT'
                  | 'FINAL'
                  | 'WEBSERVICE'
                  | 'OVERRIDE'
                  | 'VIRTUAL'
                  | 'TESTMETHOD'
                  | 'WITH_SHARING'
                  | 'WITHOUT_SHARING'
                  | 'INHERITED_SHARING';
          }
        | {
              value: ValueRuleValue<AnnotationType>;
          }
    );

export const isModifierType = (value: unknown): value is ModifierType => {
    return isCommonType(value) && value.type === 'modifier';
};

export const makeModifierAssignRule: AssignForValueRule<NormalModifierTypeClass, ModifierType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalModifierType),
    construct: (modifierTypeClass: NormalModifierTypeClass) => {
        const value = assignMultiClass(modifierTypeClass.getValue(), [
            makeLimitedStringAssignRule([
                'GLOBAL',
                'PUBLIC',
                'PROTECTED',
                'PRIVATE',
                'TRANSIENT',
                'STATIC',
                'ABSTRACT',
                'FINAL',
                'WEBSERVICE',
                'OVERRIDE',
                'VIRTUAL',
                'TESTMETHOD',
                'WITH_SHARING',
                'WITHOUT_SHARING',
                'INHERITED_SHARING',
            ]),
            makeAnnotationAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: modifierTypeClass.getType(),
            sourceInfo: makeSourceInfo(modifierTypeClass),
            value,
        };
    },
};
