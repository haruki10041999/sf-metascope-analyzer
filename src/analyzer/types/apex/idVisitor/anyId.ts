import { AnyIdContext } from '@apexdevtools/apex-parser';

export type AnyIdType = {
    type: 'anyId';
    value: string;
};

export const makeAnyIdType = (ctx: AnyIdContext): AnyIdType => {
    return {
        type: 'anyId',
        value: ctx.getText(),
    };
};
