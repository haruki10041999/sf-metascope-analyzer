import { UpsertStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './index';

import { NameType, NameVisitor } from '../nameVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type UpsertStatementType = {
    type: 'upsertStatement';
    statement: {
        type?: NameType;
        variant: ExpressionType;
        accessLevel?: StatementType;
    };
};

export const makeUpsertStatementType = (ctx: UpsertStatementContext): UpsertStatementType => {
    const variant = new ExpressionVisitor().visit(ctx.expression());

    const upsertStatementType: UpsertStatementType = {
        type: 'upsertStatement',
        statement: {
            variant: variant,
        },
    };

    if (ctx.accessLevel()) {
        const accessLevel = new StatementVisitor().visit(ctx.accessLevel());
        upsertStatementType.statement.accessLevel = accessLevel;
    }

    if (ctx.qualifiedName()) {
        const type = new NameVisitor().visit(ctx.qualifiedName());
        upsertStatementType.statement.type = type;
    }

    return upsertStatementType;
};

