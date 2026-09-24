import { RunAsStatementContext, ExpressionListContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type RunAsStatementType = {
    variant: ExpressionType[];
    block: StatementType;
};

export const makeRunAsStatementType = (ctx: RunAsStatementContext): RunAsStatementType => {
    const block = new StatementVisitor().visit(ctx.block());
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
