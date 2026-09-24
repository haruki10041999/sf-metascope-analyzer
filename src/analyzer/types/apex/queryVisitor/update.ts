import { UpdateListContext, UpdateTypeContext } from '@apexdevtools/apex-parser';

export type UpdateOperator = 'TRACKING' | 'VIEWSTAT';

export type UpdateField = {
    types: UpdateOperator[];
};

export const makeUpdateField = (ctx: UpdateListContext): UpdateField => {
    const types: UpdateOperator[] = [];
    _makeUpdateField(ctx, types);

    return {
        types: types,
    };
};

const _makeUpdateField = (ctx: UpdateListContext, updateFields: UpdateOperator[]): void => {
    const updateTypeCtx = ctx.updateType();

    if (updateTypeCtx.TRACKING()) {
        updateFields.push('TRACKING');
    }

    if (updateTypeCtx.VIEWSTAT()) {
        updateFields.push('VIEWSTAT');
    }

    if (ctx.updateList()) {
        _makeUpdateField(ctx.updateList(), updateFields);
    }
};
