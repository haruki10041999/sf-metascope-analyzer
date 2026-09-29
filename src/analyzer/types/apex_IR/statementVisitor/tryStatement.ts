import { TryStatementContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type TryStatementType = {
    type: 'tryStatement';
    statement: {
        tryBlock: BlockType;
        catchBlocks: ClauseType[];
        finallyBlock?: BlockType;
    };
};

export const makeTryStatementType = (ctx: TryStatementContext): TryStatementType => {
    if (!ctx.block() || !ctx.catchClause_list() || ctx.catchClause_list().length === 0) {
        throw new Error('値が異常です。TryStatementContext: ' + ctx.getText());
    }

    const tryBlock = new BlockVisitor().visit(ctx.block());

    const catchBlocks = ctx.catchClause_list().map((catchClauseCtx) => {
        const catchBlock = new ClauseVisitor().visit(catchClauseCtx);
        return catchBlock;
    });

    const tryStatementType: TryStatementType = {
        type: 'tryStatement',
        statement: {
            tryBlock: tryBlock,
            catchBlocks: catchBlocks,
        },
    };

    if (ctx.finallyBlock()) {
        const finallyBlock = new BlockVisitor().visit(ctx.finallyBlock());
        tryStatementType.statement.finallyBlock = finallyBlock;
    }

    return tryStatementType;
};

