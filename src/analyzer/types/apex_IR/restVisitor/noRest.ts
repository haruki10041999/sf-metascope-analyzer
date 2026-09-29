import { NoRestContext } from '@apexdevtools/apex-parser';

export type NoRestType = {
    type: 'noRest';
    rest: string;
};

export const makeNoRestType = (ctx: NoRestContext): NoRestType => {
    if (!ctx) {
        throw new Error('値が異常です。NoRestContext: ' + ctx);
    }

    return {
        type: 'noRest',
        rest: ctx.getText(),
    };
};

