import { VoidPrimaryContext } from '@apexdevtools/apex-parser';

export type VoidPrimaryType = {
    type: 'voidPrimary';
    primary: string;
};

export const makeVoidPrimaryType = (ctx: VoidPrimaryContext): VoidPrimaryType => {
    if (!ctx.VOID() || !ctx.CLASS()) {
        throw new Error('値が異常です。VoidPrimaryContext: ' + ctx.getText());
    }

    return {
        type: 'voidPrimary',
        primary: ctx.VOID().getText() + '.' + ctx.CLASS().getText(),
    };
};

