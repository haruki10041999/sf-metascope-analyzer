import { DoWhileStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type DoWhileStatementType = {
    type: 'doWhile';
    condition: ExpressionType;
    block: StatementType;
};

export const makeDoWhileStatementType = (ctx: DoWhileStatementContext): DoWhileStatementType => {
    const block = new StatementVisitor().visit(ctx.block());

    return {
        type: 'doWhile',
        condition: new ExpressionVisitor().visit(ctx.parExpression().expression()),
        block: block,
    };
};
