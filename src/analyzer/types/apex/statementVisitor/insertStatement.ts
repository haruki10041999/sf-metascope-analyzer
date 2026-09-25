import { InsertStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { AccessLevelType, makeAccessLevelType } from '../accessLevel';

export type InsertStatementType = {
    type: 'insertStatement';
    variant: Omit<ExpressionType, 'type'>;
    accessLevel?: Omit<AccessLevelType, 'type'>;
};

export const makeInsertStatementType = (ctx: InsertStatementContext): InsertStatementType => {
    const { type, ...variant } = new ExpressionVisitor().visit(ctx.expression());

    const insertStatementType: InsertStatementType = {
        type: 'insertStatement',
        variant: variant,
    };

    if (ctx.accessLevel()) {
        const { type, ...accessLevel } = makeAccessLevelType(ctx.accessLevel());
        insertStatementType.accessLevel = accessLevel;
    }

    return insertStatementType;
};

