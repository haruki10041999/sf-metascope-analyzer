import { TryStatementContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type TryStatementType = {
    type: 'tryStatement';
    tryBlock: Omit<BlockType, 'type'>;
    catchBlocks: Omit<ClauseType, 'type'>[];
    finallyBlock?: Omit<BlockType, 'type'>;
};

export const makeTryStatementType = (ctx: TryStatementContext): TryStatementType => {
    const { type: tryBlockType, ...tryBlock } = new BlockVisitor().visit(ctx.block());

    const catchBlocks = ctx.catchClause_list().map((catchClauseCtx) => {
        const { type: catchBlockType, ...catchBlock } = new ClauseVisitor().visit(catchClauseCtx);
        return catchBlock;
    });

    const tryStatementType: TryStatementType = {
        type: 'tryStatement',
        tryBlock: tryBlock,
        catchBlocks: catchBlocks,
    };

    if (ctx.finallyBlock()) {
        const { type: finallyBlockType, ...finallyBlock } = new BlockVisitor().visit(
            ctx.finallyBlock().block(),
        );
        tryStatementType.finallyBlock = finallyBlock;
    }

    return tryStatementType;
};

