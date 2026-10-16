import typia from 'typia';

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
    kind: 'normal' | 'this' | 'void' | 'super' | 'id';
    value: string;
};

export const isStringPrimaryType = typia.createIs<StringPrimaryType>();

type LiteralPrimaryType = {
    kind: 'literal';
    value: string;
    valueType: string;
};
export const isLiteralPrimaryType = typia.createIs<LiteralPrimaryType>();

type TypePrimaryType = {
    kind: 'type';
    value: TypeType;
};
export const isTypePrimaryType = typia.createIs<TypePrimaryType>();

type SoqlPrimaryType = {
    kind: 'soql';
} & SoqlType;

export const isSoqlPrimaryType = typia.createIs<SoqlPrimaryType>();

type SoslPrimaryType = {
    kind: 'sosl';
} & SoslType;

export const isSoslPrimaryType = typia.createIs<SoslPrimaryType>();

export type PrimaryType =
    StringPrimaryType | SoqlPrimaryType | LiteralPrimaryType | SoslPrimaryType | TypePrimaryType;

export const isPrimaryType = typia.createIs<PrimaryType>();

export const makePrimaryType = (primary: PrimaryClass): PrimaryType | undefined => {
    const elementClass = primary.getValue();

    if (elementClass) {
        if (isStringPrimaryElementClass(elementClass)) {
            const value = elementClass.getPrimary();
            if (value) {
                return {
                    kind: elementClass.getType(),
                    value: value.replace(/^(['"])(.*)\1$/, '$2'),
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
                    value: valueValue.replace(/^(['"])(.*)\1$/, '$2'),
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
