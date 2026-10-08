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
): string | null => {
    const soqlValue = toTypeClass(target.getValue(), isNormalIdType, errorClasses);
    return soqlValue ? normalIdConvert(soqlValue) : null;
};

export const soslIdConvert = (
    target: SoslIdTypeClass,
    errorClasses: ErrorTypeClass[],
): string[] | null => {
    const values: string[] = [];
    for (const value of target.getValue()) {
        const normalIdValue = toTypeClass(value, isNormalIdType, errorClasses);
        if (normalIdValue) {
            values.push(normalIdConvert(normalIdValue));
        }
    }
    return values.length > 0 ? values : null;
};
