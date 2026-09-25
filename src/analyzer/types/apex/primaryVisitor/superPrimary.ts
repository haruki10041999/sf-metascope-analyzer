import { SuperPrimaryContext } from '@apexdevtools/apex-parser';

export type SuperPrimaryType = {
    type: 'superPrimary';
    value: string;
};

export const makeSuperPrimaryType = (ctx: SuperPrimaryContext): SuperPrimaryType => {
    return {
        type: 'superPrimary',
        value: ctx.getText(),
    };
};

