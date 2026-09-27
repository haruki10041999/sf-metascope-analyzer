import { WithClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WithClauseType = {
    type: 'withClause';
    mode: 'SECURITY_ENFORCED' | 'SYSTEM_MODE' | 'USER_MODE' | 'DATA_CATEGORY';
    field?: Omit<ExpressionType, 'type'>;
};

export const makeWithClauseType = (ctx: WithClauseContext): WithClauseType => {
    if (ctx.SECURITY_ENFORCED()) {
        return {
            type: 'withClause',
            mode: 'SECURITY_ENFORCED',
        };
    }

    if (ctx.SYSTEM_MODE()) {
        return {
            type: 'withClause',
            mode: 'SYSTEM_MODE',
        };
    }

    if (ctx.USER_MODE()) {
        return {
            type: 'withClause',
            mode: 'USER_MODE',
        };
    }

    if (ctx.DATA() && ctx.CATEGORY()) {
        const withClauseType: WithClauseType = {
            type: 'withClause',
            mode: 'DATA_CATEGORY',
        };

        if (ctx.filteringExpression()) {
            const { type, ...fields } = new ExpressionVisitor().visit(ctx.filteringExpression());
            withClauseType.field = fields;
        }

        if (ctx.logicalExpression()) {
            const { type, ...fields } = new ExpressionVisitor().visit(ctx.logicalExpression());
            withClauseType.field = fields;
        }

        return withClauseType;
    }

    throw new Error('値が異常です。WithClauseContext: ' + ctx.getText());
};
