import { WhileStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhileStatementType = {
    type: 'while';
    condition: ExpressionType;
    statement: StatementType;
};

export const makeWhileStatementType = (ctx: WhileStatementContext): WhileStatementType => {
    return {
        type: 'while',
        condition: new ExpressionVisitor().visit(ctx.parExpression().expression()),
        statement: new StatementVisitor().visit(ctx.statement()),
    };
};
