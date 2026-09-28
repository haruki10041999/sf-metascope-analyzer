import { IdContext } from '@apexdevtools/apex-parser';

export type IdType = {
    type: 'id';
    id: string;
};

export const makeIdType = (ctx: IdContext): IdType => {
    return {
        type: 'id',
        id: ctx.getText(),
    };
};
