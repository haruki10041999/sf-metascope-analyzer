import { MergeStatementContext, AccessLevelContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type MergeStatementType = {
    type: 'merge';
    variants: ExpressionType[];
    accessLevel: 'NONE' | 'SYSTEM' | 'USER';
};

export const makeMergeStatementType = (ctx: MergeStatementContext): MergeStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    const variants = ctx.expression_list().map((expressionCtx) => {
        return new ExpressionVisitor().visit(expressionCtx);
    });
    return {
        type: 'merge',
        variants: variants,
        accessLevel: accessLevel,
    };
};
