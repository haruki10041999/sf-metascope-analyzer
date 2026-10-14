import {
    PrimaryClass,
    isStringPrimaryElementClass,
    isSoqlPrimaryElementClass,
    isTypeRefPrimaryElementClass,
    isLiteralPrimaryElementClass,
    isSoslPrimaryElementClass,
} from './converter';

import { makeTypeType, TypeType } from './type';
import { SoqlType, makesoqlType } from './query';
import { SoslType, makeSoslType } from './query';

type StringPrimaryType = {
    kind: 'value';
    value: string;
};

type LiteralPrimaryType = {
    kind: 'literal';
    value: string;
    valueType: string;
};

type TypePrimaryType = {
    kind: 'type';
    value: TypeType;
};

type SoqlPrimaryType = {
    kind: 'soql';
} & SoqlType;

type SoslPrimaryType = {
    kind: 'sosl';
} & SoslType;

export type PrimaryType =
    StringPrimaryType | SoqlPrimaryType | LiteralPrimaryType | SoslPrimaryType | TypePrimaryType;

export const makePrimaryType = (primary: PrimaryClass): PrimaryType | undefined => {
    const elementClass = primary.getValue();

    if (elementClass) {
        if (isStringPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            if (value) {
                return {
                    kind: 'value',
                    value: value,
                };
            }
        }

        if (isTypeRefPrimaryElementClass(elementClass)) {
            const value = makeTypeType(elementClass.getPrimary());
            if (value) {
                return {
                    kind: 'type',
                    value: value,
                };
            }
        }

        if (isLiteralPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            const valueValue = value.getValue();
            const valueType = value.getValueType();

            if (valueValue && valueType) {
                return {
                    kind: 'literal',
                    value: valueValue,
                    valueType: valueType,
                };
            }
        }

        if (isSoqlPrimaryElementClass(elementClass)) {
            const value = makesoqlType(elementClass.getPrimary());
            if (value) {
                return {
                    kind: 'soql',
                    ...value,
                };
            }
        }

        if (isSoslPrimaryElementClass(elementClass)) {
            const value = makeSoslType(elementClass.getPrimary());
            if (value) {
                return {
                    kind: 'sosl',
                    ...value,
                };
            }
        }
    }

    return undefined;
};
