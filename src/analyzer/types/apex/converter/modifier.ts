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

export const normalModifierConvert = (
    target: NormalModifierTypeClass,
    errorClass: ErrorTypeClass[],
): string | AnnotationTypeClass | null => {
    const value = target.getValue();
    if (!(value instanceof CommonTypeClass)) {
        return value as string;
    } else {
        return toTypeClass(value, isAnnotationType, errorClass);
    }
};

export const annotationConvert = (
    target: AnnotationTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; param: ElementValueTypeClass | ElementValuePairsTypeClass | null } => {
    let value: string | null = null;
    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        value = normalIdConvert(valueTypeClass);
    }

    let param: ElementValueTypeClass | ElementValuePairsTypeClass | null = null;
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
                param = paramTypeClass;
            }
            if (isElementValuePairsType(paramTypeClass)) {
                param = paramTypeClass;
            }
        }
    }

    return { value: value, param: param };
};
