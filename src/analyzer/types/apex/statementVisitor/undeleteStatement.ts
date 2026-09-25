import { UndeleteStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { AccessLevelType, makeAccessLevelType } from '../accessLevel';

export type UndeleteStatementType = {
    type: 'undeleteStatement';
    variant: Omit<ExpressionType, 'type'>;
    accessLevel?: Omit<AccessLevelType, 'type'>;
};

export const makeUndeleteStatementType = (ctx: UndeleteStatementContext): UndeleteStatementType => {
    const { type, ...variant } = new ExpressionVisitor().visit(ctx.expression());

    const undeleteStatementType: UndeleteStatementType = {
        type: 'undeleteStatement',
        variant: variant,
    };

    if (ctx.accessLevel()) {
        const { type, ...accessLevel } = makeAccessLevelType(ctx.accessLevel());
        undeleteStatementType.accessLevel = accessLevel;
    }

    return undeleteStatementType;
};

