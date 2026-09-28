import { VoidPrimaryContext } from '@apexdevtools/apex-parser';

export type VoidPrimaryType = {
    type: 'voidPrimary';
    primary: string;
};

export const makeVoidPrimaryType = (ctx: VoidPrimaryContext): VoidPrimaryType => {
    return {
        type: 'voidPrimary',
        primary: ctx.VOID().getText() + '.' + ctx.CLASS().getText(),
    };
};

