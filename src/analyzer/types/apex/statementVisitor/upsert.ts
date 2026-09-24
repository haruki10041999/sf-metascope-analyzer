import {
    UpsertStatementContext,
    QualifiedNameContext,
    AccessLevelContext,
} from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type UpsertStatementType = {
    type: 'upsert';
    variantType?: string;
    variant: ExpressionType;
    accessLevel: 'NONE' | 'SYSTEM' | 'USER';
};

export const makeUpsertStatementType = (ctx: UpsertStatementContext): UpsertStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    const upsertStatementType: UpsertStatementType = {
        type: 'upsert',
        variant: new ExpressionVisitor().visit(ctx.expression()),
        accessLevel: accessLevel,
    };

    if (ctx.qualifiedName()) {
        upsertStatementType.variantType = ctx
            .qualifiedName()
            .id_list()
            .map((idCtx) => idCtx.getText())
            .join('.');
    }

    return upsertStatementType;
};
