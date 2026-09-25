import { PrimaryContext } from '@apexdevtools/apex-parser';

export type PrimaryType = {
    type: 'primary';
    value: string;
};

export const makePrimaryType = (ctx: PrimaryContext): PrimaryType => {
    return {
        type: 'primary',
        value: ctx.getText(),
    };
};

