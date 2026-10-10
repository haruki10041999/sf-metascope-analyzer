import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalModifierTypeClass,
    AnnotationTypeClass,
    isNormalModifierType,
    isAnnotationType,
    isNormalIdType,
    ElementValueTypeClass,
    ElementValuePairsTypeClass,
    isElementValueType,
    isElementValuePairsType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { elementValueConvert } from './value';
import { ElementValuePair, elementValuePairsConvert } from './pair';
import { NormalLiteral } from './literal';

export type NormalModifier =
    | {
          type: 'modifier';
          value: string;
      }
    | {
          type: 'annotation';
          value?: Annotation;
      };

export const normalModifierConvert = (
    target: NormalModifierTypeClass,
    errorClass: ErrorTypeClass[],
): NormalModifier | undefined => {
    const value = target.getValue();
    let modifier: NormalModifier | undefined = undefined;

    if (typeof value === 'string') {
        modifier = {
            type: 'modifier',
            value: value,
        };
    } else {
        const typeClass = toTypeClass(value, isAnnotationType, errorClass);
        if (typeClass) {
            const annotation = annotationConvert(typeClass, errorClass);
            if (annotation) {
                return {
                    type: 'annotation',
                    value: annotation,
                };
            }
        }
    }

    return modifier;
};

export type Annotation = {
    value?: string;
    param?: NormalLiteral | ElementValuePair[];
};

export const annotationConvert = (
    target: AnnotationTypeClass,
    errorClass: ErrorTypeClass[],
): Annotation | undefined => {
    const annotation: Annotation = {};

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        annotation.value = normalIdConvert(valueTypeClass);
    }

    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(
            paramValue,
            (target): target is ElementValueTypeClass | ElementValuePairsTypeClass =>
                isElementValueType(target) || isElementValuePairsType(target),
            errorClass,
        );
        if (paramTypeClass) {
            if (isElementValueType(paramTypeClass)) {
                const elementValue = elementValueConvert(paramTypeClass, errorClass);
                if (elementValue) {
                    annotation.param = elementValue;
                }
            }
            if (isElementValuePairsType(paramTypeClass)) {
                const elementValuePairs = elementValuePairsConvert(paramTypeClass, errorClass);
                if (elementValuePairs) {
                    annotation.param = elementValuePairs;
                }
            }
        }
    }

    return annotation;
};
