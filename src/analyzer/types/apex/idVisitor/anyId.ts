import { AnyIdContext } from '@apexdevtools/apex-parser';

export type AnyIdType = {
    type: 'anyId';
    id: string;
};

export const makeAnyIdType = (ctx: AnyIdContext): AnyIdType => {
    return {
        type: 'anyId',
        id: ctx.getText(),
    };
};
