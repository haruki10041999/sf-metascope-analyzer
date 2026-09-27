import { WhereFieldExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';
import { ValueType, ValueVisitor } from '../valueVisitor';

import { ComparisonOperatorType, makeComparisonOperatorType } from '../comparisonOperator';

export type WhereFieldExpressionType = {
    type: 'whereFieldExpression';
    field: { type: 'formula'; value: string } | Omit<ExpressionType, 'type'>;
    operator: Omit<ComparisonOperatorType, 'type'>;
    value: Omit<ValueType, 'type'>;
};

export const makeWhereFieldExpressionType = (
    ctx: WhereFieldExpressionContext,
): WhereFieldExpressionType => {
    let field: { type: 'formula'; value: string } | Omit<ExpressionType, 'type'> | undefined =
        undefined;

    if (ctx.fieldExpression()) {
        const { type, ...fieldName } = new ExpressionVisitor().visit(ctx.fieldExpression());
        field = fieldName;
    }

    if (ctx.FORMULA() && ctx.StringLiteral()) {
        const { type, ...formula } = new ExpressionVisitor().visit(ctx.StringLiteral());
        field = { type: 'formula', value: formula };
    }

    if (!field) {
        throw new Error('値が異常です。WhereFieldExpressionContext: ' + ctx.getText());
    }

    const { type, ...operator } = makeComparisonOperatorType(ctx.comparisonOperator());
    const { type: _, ...value } = new ValueVisitor().visit(ctx.value());

    return {
        type: 'whereFieldExpression',
        field: field,
        operator: operator,
        value: value,
    };
};
