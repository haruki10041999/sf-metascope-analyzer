import { WhileStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhileStatementType = {
    type: 'whileStatement';
    condition: Omit<ExpressionType, 'type'>;
    statement: Omit<StatementType, 'type'>;
};

export const makeWhileStatementType = (ctx: WhileStatementContext): WhileStatementType => {
    const { type: conditionType, ...condition } = new ExpressionVisitor().visit(
        ctx.parExpression(),
    );
    const { type: statementType, ...statement } = new StatementVisitor().visit(ctx.statement());

    return {
        type: 'whileStatement',
        condition: condition,
        statement: statement,
    };
};

