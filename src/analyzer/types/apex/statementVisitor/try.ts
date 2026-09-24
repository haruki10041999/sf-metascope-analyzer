import {
    TryStatementContext,
    CatchClauseContext,
    FinallyBlockContext,
} from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ModifierField, makeModifierField } from '../modifer';

export type TryStatementType = {
    type: 'try';
    tryBlock: StatementType;
    catchBlocks: {
        exception: string;
        variant: string;
        block: StatementType;
        modifier?: ModifierField[];
    }[];
    finallyBlock?: StatementType;
};

export const makeTryStatementType = (ctx: TryStatementContext): TryStatementType => {
    const tryBlock = new StatementVisitor().visit(ctx.block());

    const catchBlocks: {
        exception: string;
        variant: string;
        block: StatementType;
        modifier?: ModifierField[];
    }[] = [];

    ctx.catchClause_list().forEach((catchClauseCtx) => {
        const exception = catchClauseCtx.qualifiedName().getText();
        const variant = catchClauseCtx.id().getText();
        const block = new StatementVisitor().visit(catchClauseCtx.block());

        const catchBlock: {
            exception: string;
            variant: string;
            block: StatementType;
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
        tryStatementType.finallyBlock = new StatementVisitor().visit(ctx.finallyBlock().block());
    }

    return tryStatementType;
};
