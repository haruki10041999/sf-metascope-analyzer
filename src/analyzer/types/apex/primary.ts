import { Primary } from './converter';

import { makeTypeType, TypeType } from './type';

export type PrimaryType = any[];

export const makePrimary = (primary: Primary): any => {
    if (primary) {
        if (
            primary.type === 'normal' ||
            primary.type === 'this' ||
            primary.type === 'super' ||
            primary.type === 'void' ||
            primary.type === 'literal'
        ) {
            const value = primary.primary;
            if (value) {
                return value;
            }
        }

        if (primary.type === 'typeRef') {
            const typeRef = primary.primary;
            if (typeRef) {
                return makeTypeType(typeRef);
            }
        }

        if (primary.type === 'soql') {
            const query = primary.primary;
        }

        if (primary.type === 'sosl') {
            const query = primary.primary;
        }
    }

    return undefined;
};
