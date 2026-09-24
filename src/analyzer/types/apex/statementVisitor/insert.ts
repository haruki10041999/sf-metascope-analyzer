import { InsertStatementContext, AccessLevelContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type InsertStatementType = {
    type: 'insert';
    variant: ExpressionType;
    accessLevel: 'NONE' | 'SYSTEM' | 'USER';
};

export const makeInsertStatementType = (ctx: InsertStatementContext): InsertStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    return {
        type: 'insert',
        variant: new ExpressionVisitor().visit(ctx.expression()),
        accessLevel: accessLevel,
    };
};
