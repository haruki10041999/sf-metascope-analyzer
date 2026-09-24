import { PrimaryContext } from '@apexdevtools/apex-parser';

export type NormalPrimaryType = {
    type: 'normal';
    value: string;
};

export const makeNormalPrimaryType = (ctx: PrimaryContext): NormalPrimaryType => {
    return {
        type: 'normal',
        value: ctx.getText(),
    };
};
