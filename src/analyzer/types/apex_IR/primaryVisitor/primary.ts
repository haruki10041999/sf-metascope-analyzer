import { PrimaryContext } from '@apexdevtools/apex-parser';

export type PrimaryType = {
    type: 'primary';
    primary: string;
};

export const makePrimaryType = (ctx: PrimaryContext): PrimaryType => {
    if (!ctx) {
        throw new Error('値が異常です。PrimaryContext: ' + ctx);
    }

    return {
        type: 'primary',
        primary: ctx.getText(),
    };
};

