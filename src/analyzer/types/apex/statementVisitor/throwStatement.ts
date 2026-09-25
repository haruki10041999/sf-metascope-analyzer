import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ThrowStatementType = {
    type: 'throwStatement';
    value: Omit<ExpressionType, 'type'>;
};

export const makeThrowStatementType = (ctx: ThrowStatementContext): ThrowStatementType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());

    return {
        type: 'throwStatement',
        value: value,
    };
};

