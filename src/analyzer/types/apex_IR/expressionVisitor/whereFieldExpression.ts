import { WhereFieldExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';
import { ValueType, ValueVisitor } from '../valueVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';

export type WhereFieldExpressionType = {
    type: 'whereFieldExpression';
    expression:
        | {
              left: string;
              operator: QueryType;
              right: ValueType;
          }
        | ExpressionType;
};

export const makeWhereFieldExpressionType = (
    ctx: WhereFieldExpressionContext,
): WhereFieldExpressionType => {
    let field: { type: 'formula'; expression: string } | ExpressionType | undefined = undefined;

    if (ctx.fieldExpression()) {
        const expression = new ExpressionVisitor().visit(ctx.fieldExpression());
        return {
            type: 'whereFieldExpression',
            expression: expression,
        };
    }

    if (ctx.FORMULA() && ctx.StringLiteral() && ctx.comparisonOperator() && ctx.value()) {
        const left = ctx.StringLiteral().getText();
        const operator = new QueryVisitor().visit(ctx.comparisonOperator());
        const right = new ValueVisitor().visit(ctx.value());
        return {
            type: 'whereFieldExpression',
            expression: {
                left: left,
                operator: operator,
                right: right,
            },
        };
    }

    throw new Error('値が異常です。WhereFieldExpressionContext: ' + ctx.getText());
};
