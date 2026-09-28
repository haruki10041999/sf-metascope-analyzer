import { WithClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type WithClauseType = {
    type: 'withClause';
    clause:
        | {
              mode: 'SECURITY_ENFORCED' | 'SYSTEM_MODE' | 'USER_MODE';
          }
        | {
              mode: 'DATA_CATEGORY';
              field: ExpressionType;
          };
};

export const makeWithClauseType = (ctx: WithClauseContext): WithClauseType => {
    if (ctx.SECURITY_ENFORCED()) {
        return {
            type: 'withClause',
            clause: {
                mode: 'SECURITY_ENFORCED',
            },
        };
    }

    if (ctx.SYSTEM_MODE()) {
        return {
            type: 'withClause',
            clause: {
                mode: 'SYSTEM_MODE',
            },
        };
    }

    if (ctx.USER_MODE()) {
        return {
            type: 'withClause',
            clause: {
                mode: 'USER_MODE',
            },
        };
    }

    if (ctx.DATA() && ctx.CATEGORY()) {
        if (ctx.filteringExpression()) {
            const fields = new ExpressionVisitor().visit(ctx.filteringExpression());
            return {
                type: 'withClause',
                clause: {
                    mode: 'DATA_CATEGORY',
                    field: fields,
                },
            };
        }

        if (ctx.logicalExpression()) {
            const fields = new ExpressionVisitor().visit(ctx.logicalExpression());
            return {
                type: 'withClause',
                clause: {
                    mode: 'DATA_CATEGORY',
                    field: fields,
                },
            };
        }
    }

    throw new Error('値が異常です。WithClauseContext: ' + ctx.getText());
};

