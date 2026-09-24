import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ThrowStatementType = {
    type: 'throw';
    value: ExpressionType;
};

export const makeThrowStatementType = (ctx: ThrowStatementContext): ThrowStatementType => {
    return {
        type: 'throw',
        value: new ExpressionVisitor().visit(ctx.expression()),
    };
};
