import { PrimaryContext } from '@apexdevtools/apex-parser';

export type PrimaryType = {
    type: 'primary';
    primary: string;
};

export const makePrimaryType = (ctx: PrimaryContext): PrimaryType => {
    return {
        type: 'primary',
        primary: ctx.getText(),
    };
};

