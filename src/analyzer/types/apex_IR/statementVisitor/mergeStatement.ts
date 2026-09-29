import { MergeStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from './index';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type MergeStatementType = {
    type: 'mergeStatement';
    statement: {
        variant: ExpressionType[];
        accessLevel?: StatementType;
    };
};

export const makeMergeStatementType = (ctx: MergeStatementContext): MergeStatementType => {
    if (!ctx.expression_list() || ctx.expression_list().length === 0) {
        throw new Error('値が異常です。MergeStatementContext: ' + ctx.getText());
    }

    const variants = ctx.expression_list().map((expressionCtx) => {
        const variant = new ExpressionVisitor().visit(expressionCtx);
        return variant;
    });

    const mergeStatementType: MergeStatementType = {
        type: 'mergeStatement',
        statement: {
            variant: variants,
        },
    };

    if (ctx.accessLevel()) {
        const accessLevel = new StatementVisitor().visit(ctx.accessLevel());
        mergeStatementType.statement.accessLevel = accessLevel;
    }

    return mergeStatementType;
};

