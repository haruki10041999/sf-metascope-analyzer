import {
    TryStatementContext,
    CatchClauseContext,
    FinallyBlockContext,
} from '@apexdevtools/apex-parser';

import { BlockStatemtType, makeBlockStatemtType } from './block';

import { ModifierField, makeModifierField } from '../modifer';

export type TryStatementType = {
    type: 'try';
    tryBlock: Omit<BlockStatemtType, 'type'>;
    catchBlocks: {
        exception: string;
        variant: string;
        block: Omit<BlockStatemtType, 'type'>;
        modifier?: ModifierField[];
    }[];
    finallyBlock?: Omit<BlockStatemtType, 'type'>;
};

export const makeTryStatementType = (ctx: TryStatementContext): TryStatementType => {
    const { type, ...tryBlock } = makeBlockStatemtType(ctx.block());

    const catchBlocks: {
        exception: string;
        variant: string;
        block: Omit<BlockStatemtType, 'type'>;
        modifier?: ModifierField[];
    }[] = [];

    ctx.catchClause_list().forEach((catchClauseCtx) => {
        const exception = catchClauseCtx.qualifiedName().getText();
        const variant = catchClauseCtx.id().getText();
        const { type, ...block } = makeBlockStatemtType(catchClauseCtx.block());

        const catchBlock: {
            exception: string;
            variant: string;
            block: Omit<BlockStatemtType, 'type'>;
            modifier?: ModifierField[];
        } = {
            exception: exception,
            variant: variant,
            block: block,
        };
        if (catchClauseCtx.modifier_list() && catchClauseCtx.modifier_list().length > 0) {
            catchBlock.modifier = catchClauseCtx.modifier_list().map((modifierCtx) => {
                return makeModifierField(modifierCtx);
            });
        }

        catchBlocks.push(catchBlock);
    });

    const tryStatementType: TryStatementType = {
        type: 'try',
        tryBlock: tryBlock,
        catchBlocks: catchBlocks,
    };

    if (ctx.finallyBlock()) {
        tryStatementType.finallyBlock = makeBlockStatemtType(ctx.finallyBlock().block());
    }

    return tryStatementType;
};
