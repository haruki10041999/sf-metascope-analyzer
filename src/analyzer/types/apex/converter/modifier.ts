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
import { NormalId, normalIdConvert } from './id';
import { ElementValue, elementValueConvert } from './value';
import { ElementValuePairs, elementValuePairsConvert } from './pair';

export type NormalModifier =
    | {
          type: 'modifier';
          value: string;
      }
    | {
          type: 'annotation';
          value: Annotation;
      }
    | undefined;

export const normalModifierConvert = (
    target: NormalModifierTypeClass,
    errorClass: ErrorTypeClass[],
): NormalModifier | undefined => {
    const value = target.getValue();
    if (!(value instanceof CommonTypeClass)) {
        return {
            type: 'modifier',
            value: value as string,
        };
    }

    const annotationTypeClass = toTypeClass(value, isAnnotationType, errorClass);
    if (annotationTypeClass) {
        return {
            type: 'annotation',
            value: annotationConvert(annotationTypeClass, errorClass),
        };
    }

    return undefined;
};

export const normalModifierListConvert = (
    targets: (NormalModifierTypeClass | ErrorTypeClass)[],
    errorClass: ErrorTypeClass[],
): NormalModifier[] | undefined => {
    const values: NormalModifier[] = [];
    targets.forEach((item) => {
        const typeClass = toTypeClass(item, isNormalModifierType, errorClass);
        const value = typeClass ? normalModifierConvert(typeClass, errorClass) : undefined;
        if (value) {
            values.push(value);
        }
    });
    return values.length > 0 ? values : undefined;
};

export type Annotation = {
    value: NormalId | undefined;
    param: ElementValue | ElementValuePairs;
};

export const annotationConvert = (
    target: AnnotationTypeClass,
    errorClass: ErrorTypeClass[],
): Annotation => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    let param: Annotation['param'] = undefined;
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
                param = elementValueConvert(paramTypeClass, errorClass);
            }
            if (isElementValuePairsType(paramTypeClass)) {
                param = elementValuePairsConvert(paramTypeClass, errorClass);
            }
        }
    }

    return {
        value: valueTypeClass ? normalIdConvert(valueTypeClass) : undefined,
        param: param,
    };
};
