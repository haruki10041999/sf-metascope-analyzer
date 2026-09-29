import { ThisPrimaryContext } from '@apexdevtools/apex-parser';

export type ThisPrimaryType = {
    type: 'thisPrimary';
    primary: string;
};

export const makeThisPrimaryType = (ctx: ThisPrimaryContext): ThisPrimaryType => {
    if (!ctx.THIS()) {
        throw new Error('値が異常です。ThisPrimaryContext: ' + ctx.getText());
    }

    return {
        type: 'thisPrimary',
        primary: ctx.THIS().getText(),
    };
};

