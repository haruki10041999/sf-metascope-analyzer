import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '.';

export type FinallyBlockType = {
    type: 'finallyBlock';
    block: BlockType;
};

export const makeFinallyBlockType = (ctx: FinallyBlockContext): FinallyBlockType => {
    return {
        type: 'finallyBlock',
        block: new BlockVisitor().visit(ctx.block()),
    };
};
