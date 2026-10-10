import {
    ErrorTypeClass,
    NormalIdTypeClass,
    AnyIdTypeClass,
    SoqlIdTypeClass,
    SoslIdTypeClass,
    isNormalIdType,
} from '../../apex_IR';

import { toTypeClass } from './commons';

export const normalIdConvert = (target: NormalIdTypeClass): string => {
    return target.getValue();
};

export const anyIdConvert = (target: AnyIdTypeClass): string => {
    return target.getValue();
};

export const soqlIdConvert = (
    target: SoqlIdTypeClass,
    errorClasses: ErrorTypeClass[],
): string | undefined => {
    const soqlValue = toTypeClass(target.getValue(), isNormalIdType, errorClasses);
    if (soqlValue) {
        return normalIdConvert(soqlValue);
    }
};

export const soslIdConvert = (
    target: SoslIdTypeClass,
    errorClasses: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    for (const value of target.getValue()) {
        const normalIdValue = toTypeClass(value, isNormalIdType, errorClasses);
        if (normalIdValue) {
            values.push(normalIdConvert(normalIdValue));
        }
    }
    return values;
};
