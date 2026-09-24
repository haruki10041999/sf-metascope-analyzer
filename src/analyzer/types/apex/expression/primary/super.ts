import { SuperPrimaryContext } from '@apexdevtools/apex-parser';

export type SuperPrimaryType = {
    type: 'super';
    value: string;
};

export const makeSuperPrimaryType = (ctx: SuperPrimaryContext): SuperPrimaryType => {
    return {
        type: 'super',
        value: ctx.getText(),
    };
};
