import { UpdateStatementContext, AccessLevelContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type UpdateStatementType = {
    type: 'update';
    variant: ExpressionType;
    accessLevel: 'NONE' | 'SYSTEM' | 'USER';
};

export const makeUpdateStatementType = (ctx: UpdateStatementContext): UpdateStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    return {
        type: 'update',
        variant: new ExpressionVisitor().visit(ctx.expression()),
        accessLevel: accessLevel,
    };
};
