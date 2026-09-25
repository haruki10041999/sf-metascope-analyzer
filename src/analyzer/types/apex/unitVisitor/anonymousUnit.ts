import { AnonymousUnitContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';

export type AnonymousUnitType = {
    type: 'anonymousUnit';
    block: Omit<BlockType, 'type'>;
};

export const makeAnonymousUnitType = (ctx: AnonymousUnitContext): AnonymousUnitType => {
    const { type, ...block } = new BlockVisitor().visit(ctx.anonymousBlock());

    return {
        type: 'anonymousUnit',
        block: block,
    };
};
