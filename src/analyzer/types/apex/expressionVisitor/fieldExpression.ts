import { FieldExpressionContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { ValueType, ValueVisitor } from '../valueVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';

export type FieldExpressionType = {
    type: 'fieldExpression';
    expression: {
        left: NameType | QueryType;
        operator: QueryType;
        right: ValueType;
    };
};

export const makeFieldExpressionType = (ctx: FieldExpressionContext): FieldExpressionType => {
    const operator = new QueryVisitor().visit(ctx.comparisonOperator());
    const value = new ValueVisitor().visit(ctx.value());

    if (ctx.fieldName()) {
        const field = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'fieldExpression',
            expression: {
                left: field,
                operator: operator,
                right: value,
            },
        };
    }

    if (ctx.soqlFunction()) {
        const field = new QueryVisitor().visit(ctx.soqlFunction());
        return {
            type: 'fieldExpression',
            expression: {
                left: field,
                operator: operator,
                right: value,
            },
        };
    }

    throw new Error('値が異常です。FieldExpressionCotnext: ' + ctx.getText());
};

