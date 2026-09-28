import { FieldExpressionContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { ValueType, ValueVisitor } from '../valueVisitor';

import { ComparisonOperatorType, makeComparisonOperatorType } from '../comparisonOperator';
import { SoqlFunctionType, makeSoqlFunctionType } from '../soqlFunction';

export type FieldExpressionType = {
    type: 'fieldExpression';
    expression: {
        left: NameType | SoqlFunctionType;
        operator: ComparisonOperatorType;
        right: ValueType;
    };
};

export const makeFieldExpressionType = (ctx: FieldExpressionContext): FieldExpressionType => {
    const operator = makeComparisonOperatorType(ctx.comparisonOperator());
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
        const field = makeSoqlFunctionType(ctx.soqlFunction());
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

