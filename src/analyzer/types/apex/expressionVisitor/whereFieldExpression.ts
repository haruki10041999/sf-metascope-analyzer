import { WhereFieldExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';
import { ValueType, ValueVisitor } from '../valueVisitor';

import { ComparisonOperatorType, makeComparisonOperatorType } from '../comparisonOperator';

export type WhereFieldExpressionType = {
    type: 'whereFieldExpression';
    expression: {
        left: { type: 'formula'; expression: string } | ExpressionType;
        operator: ComparisonOperatorType;
        right: ValueType;
    };
};

export const makeWhereFieldExpressionType = (
    ctx: WhereFieldExpressionContext,
): WhereFieldExpressionType => {
    let field: { type: 'formula'; expression: string } | ExpressionType | undefined = undefined;

    if (ctx.fieldExpression()) {
        const fieldName = new ExpressionVisitor().visit(ctx.fieldExpression());
        field = fieldName;
    }

    if (ctx.FORMULA() && ctx.StringLiteral()) {
        const formula = ctx.StringLiteral().getText();
        field = { type: 'formula', expression: formula };
    }

    if (!field) {
        throw new Error('値が異常です。WhereFieldExpressionContext: ' + ctx.getText());
    }

    const operator = makeComparisonOperatorType(ctx.comparisonOperator());
    const value = new ValueVisitor().visit(ctx.value());

    return {
        type: 'whereFieldExpression',
        expression: {
            left: field,
            operator: operator,
            right: value,
        },
    };
};

