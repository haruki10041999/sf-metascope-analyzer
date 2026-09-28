import { WhileStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhileStatementType = {
    type: 'whileStatement';
    statement: {
        condition: ExpressionType;
        statement: StatementType;
    };
};

export const makeWhileStatementType = (ctx: WhileStatementContext): WhileStatementType => {
    const condition = new ExpressionVisitor().visit(ctx.parExpression());
    const statement = new StatementVisitor().visit(ctx.statement());

    return {
        type: 'whileStatement',
        statement: {
            condition: condition,
            statement: statement,
        },
    };
};

