import { UpdateTypeContext } from '@apexdevtools/apex-parser';

export type UpdateOperator = 'TRACKING' | 'VIEWSTAT';

export type UpdateTypeType = {
    type: 'updateType';
    mode: UpdateOperator;
};

export const makeUpdateTypeType = (ctx: UpdateTypeContext): UpdateTypeType => {
    if (ctx.TRACKING()) {
        return {
            type: 'updateType',
            mode: 'TRACKING',
        };
    }

    if (ctx.VIEWSTAT()) {
        return {
            type: 'updateType',
            mode: 'VIEWSTAT',
        };
    }

    throw new Error('値が異常です: ' + ctx.getText());
};
