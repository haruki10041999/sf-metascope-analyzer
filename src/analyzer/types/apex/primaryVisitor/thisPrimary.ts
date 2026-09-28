import { ThisPrimaryContext } from '@apexdevtools/apex-parser';

export type ThisPrimaryType = {
    type: 'thisPrimary';
    primary: string;
};

export const makeThisPrimaryType = (ctx: ThisPrimaryContext): ThisPrimaryType => {
    return {
        type: 'thisPrimary',
        primary: ctx.THIS().getText(),
    };
};

