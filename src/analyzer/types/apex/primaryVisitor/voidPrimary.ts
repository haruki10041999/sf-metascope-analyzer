import { VoidPrimaryContext } from '@apexdevtools/apex-parser';

export type VoidPrimaryType = {
    type: 'voidPrimary';
    value: string;
};

export const makeVoidPrimaryType = (ctx: VoidPrimaryContext): VoidPrimaryType => {
    return {
        type: 'voidPrimary',
        value: ctx.getText(),
    };
};

