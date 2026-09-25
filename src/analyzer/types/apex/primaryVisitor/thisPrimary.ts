import { ThisPrimaryContext } from '@apexdevtools/apex-parser';

export type ThisPrimaryType = {
    type: 'thisPrimary';
    value: string;
};

export const makeThisPrimaryType = (ctx: ThisPrimaryContext): ThisPrimaryType => {
    return {
        type: 'thisPrimary',
        value: ctx.getText(),
    };
};

