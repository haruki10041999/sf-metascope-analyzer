import { RunAsStatementContext, ExpressionListContext } from '@apexdevtools/apex-parser';

import { BlockStatemtType, makeBlockStatemtType } from './block';

import { ExpressionField, ExpressionVisitor } from '../expression';

export type RunAsStatementType = {
    variant: ExpressionField[];
    block: Omit<BlockStatemtType, 'type'>;
};

export const makeRunAsStatementType = (ctx: RunAsStatementContext): RunAsStatementType => {
    const { type, ...block } = makeBlockStatemtType(ctx.block());
    const variant = ctx
        .expressionList()
        .expression_list()
        .map((expressionCtx) => {
            return new ExpressionVisitor().visit(expressionCtx);
        });

    return {
        variant: variant,
        block: block,
    };
};

