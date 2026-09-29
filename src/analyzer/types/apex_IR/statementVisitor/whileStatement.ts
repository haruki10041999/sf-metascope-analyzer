import { WhileStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WhileStatementType = {
    type: 'whileStatement';
    statement: {
        condition: ExpressionType;
        block: StatementType;
    };
};

export const makeWhileStatementType = (ctx: WhileStatementContext): WhileStatementType => {
    if (!ctx.parExpression() || !ctx.statement()) {
        throw new Error('値が異常です。WhileStatementContext: ' + ctx.getText());
    }

    const condition = new ExpressionVisitor().visit(ctx.parExpression());
    const statement = new StatementVisitor().visit(ctx.statement());

    return {
        type: 'whileStatement',
        statement: {
            condition: condition,
            block: statement,
        },
    };
};

