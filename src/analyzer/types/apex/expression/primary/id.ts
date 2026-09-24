import { IdPrimaryContext } from '@apexdevtools/apex-parser';

export type IdPrimaryType = {
    type: 'id';
    value: string;
};

export const makeIdPrimaryType = (ctx: IdPrimaryContext): IdPrimaryType => {
    return {
        type: 'id',
        value: ctx.getText(),
    };
};
