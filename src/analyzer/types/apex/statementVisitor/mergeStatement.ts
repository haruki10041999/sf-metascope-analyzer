import { MergeStatementContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { AccessLevelType, makeAccessLevelType } from '../accessLevel';

export type MergeStatementType = {
    type: 'mergeStatement';
    variants: Omit<ExpressionType, 'type'>[];
    accessLevel?: Omit<AccessLevelType, 'type'>;
};

export const makeMergeStatementType = (ctx: MergeStatementContext): MergeStatementType => {
    const variants = ctx.expression_list().map((expressionCtx) => {
        const { type, ...variant } = new ExpressionVisitor().visit(expressionCtx);
        return variant;
    });

    const mergeStatementType: MergeStatementType = {
        type: 'mergeStatement',
        variants: variants,
    };

    if (ctx.accessLevel()) {
        const { type, ...accessLevel } = makeAccessLevelType(ctx.accessLevel());
        mergeStatementType.accessLevel = accessLevel;
    }

    return mergeStatementType;
};

