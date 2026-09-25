import { UpdateStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { AccessLevelType, makeAccessLevelType } from '../accessLevel';

export type UpdateStatementType = {
    type: 'updateStatement';
    variant: Omit<ExpressionType, 'type'>;
    accessLevel?: Omit<AccessLevelType, 'type'>;
};

export const makeUpdateStatementType = (ctx: UpdateStatementContext): UpdateStatementType => {
    const { type, ...variant } = new ExpressionVisitor().visit(ctx.expression());

    const updateStatementType: UpdateStatementType = {
        type: 'updateStatement',
        variant: variant,
    };

    if (ctx.accessLevel()) {
        const { type, ...accessLevel } = makeAccessLevelType(ctx.accessLevel());
        updateStatementType.accessLevel = accessLevel;
    }

    return updateStatementType;
};

