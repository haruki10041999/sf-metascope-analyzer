import { SetterContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from './blockVisitor';

export type SetterType = {
    type: 'setter';
    body?: Omit<BlockType, 'type'>;
};

export const makeSetterType = (ctx: SetterContext): SetterType => {
    const setterType: SetterType = { type: 'setter' };
    if (ctx.block()) {
        const { type: bodyType, ...body } = new BlockVisitor().visit(ctx.block());
        setterType.body = body;
    }
    return setterType;
};
