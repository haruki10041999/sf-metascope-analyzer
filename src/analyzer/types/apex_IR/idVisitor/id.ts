import { IdContext } from '@apexdevtools/apex-parser';

export type IdType = {
    type: 'id';
    id: string;
};

export const makeIdType = (ctx: IdContext): IdType => {
    if (!ctx) {
        throw new Error('値が異常です。IdContext: ' + ctx);
    }

    return {
        type: 'id',
        id: ctx.getText(),
    };
};
