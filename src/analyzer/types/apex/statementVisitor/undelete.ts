import { UndeleteStatementContext, AccessLevelContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type UnDeleteStatementType = {
    type: 'unDelete';
    variant: ExpressionType;
    accessLevel: 'NONE' | 'SYSTEM' | 'USER';
};

export const makeUnDeleteStatementType = (ctx: UndeleteStatementContext): UnDeleteStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    return {
        type: 'unDelete',
        variant: new ExpressionVisitor().visit(ctx.expression()),
        accessLevel: accessLevel,
    };
};
