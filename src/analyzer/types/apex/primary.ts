import {
    PrimaryClass,
    NormalQueryClass,
    TypeRefClass,
    NormalLiteralClass,
    SoslLiteralClass,
    StringPrimaryElementClass,
    SoqlPrimaryElementClass,
    TypeRefPrimaryElementClass,
    LiteralPrimaryElementClass,
    SoslPrimaryElementClass,
    isStringPrimaryElementClass,
    isSoqlPrimaryElementClass,
    isTypeRefPrimaryElementClass,
    isLiteralPrimaryElementClass,
    isSoslPrimaryElementClass,
} from './converter';

import { makeTypeType, TypeType } from './type';

type SoqlPrimaryType = NormalQueryClass;
type LiteralPrimaryType = {
    value: string;
    valueType: string;
};
type SoslPrimaryType = SoslLiteralClass;

export type PrimaryType =
    string | SoqlPrimaryType | LiteralPrimaryType | SoslPrimaryType | TypeType | 'unSupported';

export const makePrimaryType = (primary: PrimaryClass): PrimaryType => {
    const elementClass = primary.getValue();

    if (elementClass) {
        if (isStringPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            if (value) {
                return value;
            }
        }

        if (isTypeRefPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            return makeTypeType(value);
        }

        if (isLiteralPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            const valueValue = value.getValue();
            const valueType = value.getValueType();

            if (valueValue && valueType) {
                return {
                    value: valueValue,
                    valueType: valueType,
                };
            }
        }

        if (isSoqlPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            return value;
        }

        if (isSoslPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            return value;
        }
    }

    return 'unSupported';
};
