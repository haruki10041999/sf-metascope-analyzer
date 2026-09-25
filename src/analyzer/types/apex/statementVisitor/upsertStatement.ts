import { UpsertStatementContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { AccessLevelType, makeAccessLevelType } from '../accessLevel';

export type UpsertStatementType = {
    type: 'upsertStatement';
    variantType?: Omit<NameType, 'type'>;
    variant: Omit<ExpressionType, 'type'>;
    accessLevel?: Omit<AccessLevelType, 'type'>;
};

export const makeUpsertStatementType = (ctx: UpsertStatementContext): UpsertStatementType => {
    const { type, ...variant } = new ExpressionVisitor().visit(ctx.expression());

    const upsertStatementType: UpsertStatementType = {
        type: 'upsertStatement',
        variant: variant,
    };

    if (ctx.accessLevel()) {
        const { type, ...accessLevel } = makeAccessLevelType(ctx.accessLevel());
        upsertStatementType.accessLevel = accessLevel;
    }

    if (ctx.qualifiedName()) {
        const { type, ...variantType } = new NameVisitor().visit(ctx.qualifiedName());
        upsertStatementType.variantType = variantType;
    }

    return upsertStatementType;
};

