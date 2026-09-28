import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ThrowStatementType = {
    type: 'throwStatement';
    statement: ExpressionType;
};

export const makeThrowStatementType = (ctx: ThrowStatementContext): ThrowStatementType => {
    const statement = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'throwStatement',
        statement: statement,
    };
};

