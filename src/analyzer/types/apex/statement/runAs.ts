import { RunAsStatementContext, ExpressionListContext } from '@apexdevtools/apex-parser';

import { BlockStatemtType, makeBlockStatemtType } from './block';

export type RunAsStatementType = {
    variant: string[];
    block: Omit<BlockStatemtType, 'type'>;
};

export const makeRunAsStatementType = (ctx: RunAsStatementContext): RunAsStatementType => {
    const { type, ...block } = makeBlockStatemtType(ctx.block());
    const variant = ctx
        .expressionList()
        .expression_list()
        .map((expressionCtx) => {
            return expressionCtx.getText();
        });

    return {
        variant: variant,
        block: block,
    };
};
