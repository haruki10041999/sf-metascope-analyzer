import { DeleteStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './index';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type DeleteStatementType = {
    type: 'deleteStatement';
    statement: {
        variant: ExpressionType;
        accessLevel?: StatementType;
    };
};

export const makeDeleteStatementType = (ctx: DeleteStatementContext): DeleteStatementType => {
    const variant = new ExpressionVisitor().visit(ctx.expression());

    const deleteStatementType: DeleteStatementType = {
        type: 'deleteStatement',
        statement: {
            variant: variant,
        },
    };

    if (ctx.accessLevel()) {
        const accessLevel = new StatementVisitor().visit(ctx.accessLevel());
        deleteStatementType.statement.accessLevel = accessLevel;
    }

    return deleteStatementType;
};

