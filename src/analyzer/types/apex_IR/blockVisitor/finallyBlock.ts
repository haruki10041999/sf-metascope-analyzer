import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '.';

export type FinallyBlockType = {
    type: 'finallyBlock';
    block: BlockType;
};

export const makeFinallyBlockType = (ctx: FinallyBlockContext): FinallyBlockType => {
    if (!ctx.block()) {
        throw new Error('値が異常です。FinallyBlockContext: ' + ctx.getText());
    }

    return {
        type: 'finallyBlock',
        block: new BlockVisitor().visit(ctx.block()),
    };
};
