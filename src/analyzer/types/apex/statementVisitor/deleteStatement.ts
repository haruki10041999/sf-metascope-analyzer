import { DeleteStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { AccessLevelType, makeAccessLevelType } from '../accessLevel';

export type DeleteStatementType = {
    type: 'deleteStatement';
    variant: Omit<ExpressionType, 'type'>;
    accessLevel?: Omit<AccessLevelType, 'type'>;
};

export const makeDeleteStatementType = (ctx: DeleteStatementContext): DeleteStatementType => {
    const { type, ...variant } = new ExpressionVisitor().visit(ctx.expression());

    const deleteStatementType: DeleteStatementType = {
        type: 'deleteStatement',
        variant: variant,
    };

    if (ctx.accessLevel()) {
        const { type, ...accessLevel } = makeAccessLevelType(ctx.accessLevel());
        deleteStatementType.accessLevel = accessLevel;
    }

    return deleteStatementType;
};

