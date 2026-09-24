import { WhileStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { StatementField, makeStatementField } from '.';

import { ExpressionField, ExpressionVisitor } from '../expression';

export type WhileStatementType = {
    type: 'while';
    condition: ExpressionField;
    statement: StatementField;
};

export const makeWhileStatementType = (ctx: WhileStatementContext): WhileStatementType => {
    return {
        type: 'while',
        condition: new ExpressionVisitor().visit(ctx.parExpression().expression()),
        statement: makeStatementField(ctx.statement()),
    };
};

