import { AnyIdContext } from '@apexdevtools/apex-parser';

export type AnyIdType = {
    type: 'anyId';
    id: string;
};

export const makeAnyIdType = (ctx: AnyIdContext): AnyIdType => {
    if (!ctx) {
        throw new Error('値が異常です。AnyIdContext: ' + ctx);
    }
    return {
        type: 'anyId',
        id: ctx.getText(),
    };
};
