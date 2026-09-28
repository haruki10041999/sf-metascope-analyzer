import { InsertStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './index';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type InsertStatementType = {
    type: 'insertStatement';
    statement: {
        variant: ExpressionType;
        accessLevel?: StatementType;
    };
};

export const makeInsertStatementType = (ctx: InsertStatementContext): InsertStatementType => {
    const variant = new ExpressionVisitor().visit(ctx.expression());

    const insertStatementType: InsertStatementType = {
        type: 'insertStatement',
        statement: {
            variant: variant,
        },
    };

    if (ctx.accessLevel()) {
        const accessLevel = new StatementVisitor().visit(ctx.accessLevel());
        insertStatementType.statement.accessLevel = accessLevel;
    }

    return insertStatementType;
};

