import { SuperPrimaryContext } from '@apexdevtools/apex-parser';

export type SuperPrimaryType = {
    type: 'superPrimary';
    primary: string;
};

export const makeSuperPrimaryType = (ctx: SuperPrimaryContext): SuperPrimaryType => {
    if (!ctx.SUPER()) {
        throw new Error('値が異常です。SuperPrimaryContext: ' + ctx.getText());
    }
    return {
        type: 'superPrimary',
        primary: ctx.SUPER().getText(),
    };
};

