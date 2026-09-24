import { ThisPrimaryContext } from '@apexdevtools/apex-parser';

export type ThisPrimaryType = {
    type: 'this';
    value: string;
};

export const makeThisPrimaryType = (ctx: ThisPrimaryContext): ThisPrimaryType => {
    return {
        type: 'this',
        value: ctx.getText(),
    };
};
