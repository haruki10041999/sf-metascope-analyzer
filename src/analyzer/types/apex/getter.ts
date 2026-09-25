import { GetterContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from './blockVisitor';

export type GetterType = {
    type: 'getter';
    body?: Omit<BlockType, 'type'>;
};

export const makeGetterType = (ctx: GetterContext): GetterType => {
    const getterType: GetterType = { type: 'getter' };
    if (ctx.block()) {
        const { type: bodyType, ...body } = new BlockVisitor().visit(ctx.block());
        getterType.body = body;
    }
    return getterType;
};
