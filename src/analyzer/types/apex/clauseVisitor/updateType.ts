import { UpdateTypeContext } from '@apexdevtools/apex-parser';

export type UpdateOperator = 'TRACKING' | 'VIEWSTAT';

export type UpdateTypeType = {
    type: 'updateType';
    clause: UpdateOperator;
};

export const makeUpdateTypeType = (ctx: UpdateTypeContext): UpdateTypeType => {
    if (ctx.TRACKING()) {
        return {
            type: 'updateType',
            clause: 'TRACKING',
        };
    }

    if (ctx.VIEWSTAT()) {
        return {
            type: 'updateType',
            clause: 'VIEWSTAT',
        };
    }

    throw new Error('値が異常です UpdateTypeContext:' + ctx.getText());
};

