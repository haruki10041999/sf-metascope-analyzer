import { DeleteStatementContext, AccessLevelContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type DeleteStatementType = {
    type: 'delete';
    variant: ExpressionType;
    accessLevel: 'NONE' | 'SYSTEM' | 'USER';
};

export const makeDeleteStatementType = (ctx: DeleteStatementContext): DeleteStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    return {
        type: 'delete',
        variant: new ExpressionVisitor().visit(ctx.expression()),
        accessLevel: accessLevel,
    };
};
