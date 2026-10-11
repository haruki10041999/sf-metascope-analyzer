import { Primary, NormalQuery, TypeRef, NormalLiteral, SoslLiteral } from './converter';

import { makeTypeType, TypeType } from './type';

type SoqlPrimaryType = NormalQuery;
type LiteralPrimaryType = {
    value: string;
    valueType: string;
};
type SoslPrimaryType = SoslLiteral;

export type PrimaryType =
    string | SoqlPrimaryType | LiteralPrimaryType | SoslPrimaryType | TypeType | 'unSupported';

export const makePrimaryType = (primary: Primary): PrimaryType => {
    const { type, primary: value } = primary;
    if (
        (type === 'normal' ||
            type === 'this' ||
            type === 'super' ||
            type === 'void' ||
            type === 'id') &&
        value
    ) {
        return value;
    }

    if (type === 'typeRef') {
        return makeTypeType(value);
    }

    if (type === 'literal' && value) {
        const { value: valueValue, valueType } = value;
        if (valueValue && valueType) {
            return {
                value: valueValue,
                valueType: valueType,
            };
        }
    }

    if (type === 'soql') {
        return value;
    }

    if (type === 'sosl') {
        return value;
    }

    return 'unSupported';
};
