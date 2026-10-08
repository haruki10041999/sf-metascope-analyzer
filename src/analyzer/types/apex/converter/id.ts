import {
    ErrorTypeClass,
    NormalIdTypeClass,
    AnyIdTypeClass,
    SoqlIdTypeClass,
    SoslIdTypeClass,
    isNormalIdType,
} from '../../apex_IR';

import { toTypeClass } from './commons';

export type NormalId = string;

export const normalIdConvert = (target: NormalIdTypeClass): NormalId => {
    return target.getValue();
};

export type AnyId = string;

export const anyIdConvert = (target: AnyIdTypeClass): AnyId => {
    return target.getValue();
};

export type SoqlId = string | null;

export const soqlIdConvert = (target: SoqlIdTypeClass, errorClasses: ErrorTypeClass[]): SoqlId => {
    const soqlValue = toTypeClass(target.getValue(), isNormalIdType, errorClasses);
    return soqlValue ? normalIdConvert(soqlValue) : null;
};

export type SoslId = string[] | null;

export const soslIdConvert = (target: SoslIdTypeClass, errorClasses: ErrorTypeClass[]): SoslId => {
    const values: string[] = [];
    for (const value of target.getValue()) {
        const normalIdValue = toTypeClass(value, isNormalIdType, errorClasses);
        if (normalIdValue) {
            values.push(normalIdConvert(normalIdValue));
        }
    }
    return values.length > 0 ? values : null;
};
