import { UpdateStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './index';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type UpdateStatementType = {
    type: 'updateStatement';
    statement: {
        variant: ExpressionType;
        accessLevel?: StatementType;
    };
};

export const makeUpdateStatementType = (ctx: UpdateStatementContext): UpdateStatementType => {
    if (!ctx.expression()) {
        throw new Error('値が異常です。UpdateStatementContext: ' + ctx.getText());
    }

    const name = new ExpressionVisitor().visit(ctx.expression());

    const updateStatementType: UpdateStatementType = {
        type: 'updateStatement',
        statement: {
            variant: name,
        },
    };

    if (ctx.accessLevel()) {
        const accessLevel = new StatementVisitor().visit(ctx.accessLevel());
        updateStatementType.statement.accessLevel = accessLevel;
    }

    return updateStatementType;
};

