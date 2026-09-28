import { UndeleteStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './index';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type UndeleteStatementType = {
    type: 'undeleteStatement';
    statement: {
        variant: ExpressionType;
        accessLevel?: StatementType;
    };
};

export const makeUndeleteStatementType = (ctx: UndeleteStatementContext): UndeleteStatementType => {
    const name = new ExpressionVisitor().visit(ctx.expression());

    const undeleteStatementType: UndeleteStatementType = {
        type: 'undeleteStatement',
        statement: {
            variant: name,
        },
    };

    if (ctx.accessLevel()) {
        const accessLevel = new StatementVisitor().visit(ctx.accessLevel());
        undeleteStatementType.statement.accessLevel = accessLevel;
    }

    return undeleteStatementType;
};

