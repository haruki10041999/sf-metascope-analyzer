import { VoidPrimaryContext } from '@apexdevtools/apex-parser';

export type VoidPrimaryType = {
    type: 'void';
    value: string;
};

export const makeVoidPrimaryType = (ctx: VoidPrimaryContext): VoidPrimaryType => {
    return {
        type: 'void',
        value: ctx.getText(),
    };
};
