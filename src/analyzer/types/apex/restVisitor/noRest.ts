import { NoRestContext } from '@apexdevtools/apex-parser';

export type NoRestType = {
    type: 'noRest';
    value: string;
};

export const makeNoRestType = (ctx: NoRestContext): NoRestType => {
    return {
        type: 'noRest',
        value: ctx.getText(),
    };
};
