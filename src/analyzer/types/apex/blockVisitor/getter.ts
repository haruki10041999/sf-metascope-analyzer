import { GetterContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '.';

export type GetterType = {
    type: 'getter';
    body?: BlockType;
};

export const makeGetterType = (ctx: GetterContext): GetterType => {
    const getterType: GetterType = { type: 'getter' };
    if (ctx.block()) {
        const body = new BlockVisitor().visit(ctx.block());
        getterType.body = body;
    }
    return getterType;
};
