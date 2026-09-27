import { FieldExpressionContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { ValueType, ValueVisitor } from '../valueVisitor';

import { ComparisonOperatorType, makeComparisonOperatorType } from '../comparisonOperator';
import { SoqlFunctionType, makeSoqlFunctionType } from '../soqlFunction';

export type FieldExpressionType = {
    type: 'fieldExpression';
    field: Omit<NameType, 'type'> | Omit<SoqlFunctionType, 'type'>;
    operator: Omit<ComparisonOperatorType, 'type'>;
    value: Omit<ValueType, 'type'>;
};

export const makeFieldExpressionType = (ctx: FieldExpressionContext): FieldExpressionType => {
    const { type: __, ...operator } = makeComparisonOperatorType(ctx.comparisonOperator());
    const { type: _, ...value } = new ValueVisitor().visit(ctx.value());

    if (ctx.fieldName()) {
        const { type: ___, ...field } = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'fieldExpression',
            field: field,
            operator: operator,
            value: value,
        };
    }

    if (ctx.soqlFunction()) {
        const { type: ___, ...field } = makeSoqlFunctionType(ctx.soqlFunction());
        return {
            type: 'fieldExpression',
            field: field,
            operator: operator,
            value: value,
        };
    }

    throw new Error('値が異常です。FieldExpressionCotnext: ' + ctx.getText());
};
