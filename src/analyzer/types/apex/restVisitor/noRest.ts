import { NoRestContext } from '@apexdevtools/apex-parser';

export type NoRestType = {
    type: 'noRest';
    rest: string;
};

export const makeNoRestType = (ctx: NoRestContext): NoRestType => {
    return {
        type: 'noRest',
        rest: ctx.getText(),
    };
};

