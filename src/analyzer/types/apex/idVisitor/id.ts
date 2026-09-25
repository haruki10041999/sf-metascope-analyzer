import { IdContext } from '@apexdevtools/apex-parser';

export type IdType = {
    type: 'id';
    value: string;
};

export const makeIdType = (ctx: IdContext): IdType => {
    return {
        type: 'id',
        value: ctx.getText(),
    };
};
