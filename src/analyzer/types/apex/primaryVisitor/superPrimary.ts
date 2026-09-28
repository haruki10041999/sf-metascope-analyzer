import { SuperPrimaryContext } from '@apexdevtools/apex-parser';

export type SuperPrimaryType = {
    type: 'superPrimary';
    primary: string;
};

export const makeSuperPrimaryType = (ctx: SuperPrimaryContext): SuperPrimaryType => {
    return {
        type: 'superPrimary',
        primary: ctx.SUPER().getText(),
    };
};

