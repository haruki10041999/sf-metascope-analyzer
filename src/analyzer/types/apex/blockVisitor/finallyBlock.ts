import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '.';

export type FinallyBlockType = {
    type: 'finallyBlock';
    block: Omit<BlockType, 'type'>;
};

export const makeFinallyBlockType = (ctx: FinallyBlockContext): FinallyBlockType => {
    return {
        type: 'finallyBlock',
        block: new BlockVisitor().visitBlockContext(ctx.block()),
    };
};
