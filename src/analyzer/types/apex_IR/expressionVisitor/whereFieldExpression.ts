import { WhereFieldExpressionContext } from '@apexdevtools/apex-parser';

import {
    FieldExpressionTypeClass,
    DoubleOperatorExpressionTypeClass,
    ExpressionVisitor,
    isFieldExpressionType,
} from '.';

import {
    ComparisonOperatorTypeClass,
    QueryVisitor,
    isComparisonOperatorType,
} from '../queryVisitor';
import { NormalValueTypeClass, ValueVisitor, isNormalValueType } from '../valueVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class WhereFieldExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    FieldExpressionTypeClass | string,
    ComparisonOperatorTypeClass,
    NormalValueTypeClass
> {
    private constructor(
        left: FieldExpressionTypeClass | string | ErrorTypeClass,
        operator: ComparisonOperatorTypeClass | ErrorTypeClass,
        right: NormalValueTypeClass | ErrorTypeClass,
    ) {
        super('whereFieldExpression', left, right, operator);
    }

    static create(ctx: WhereFieldExpressionContext): WhereFieldExpressionTypeClass {
        if (
            !ctx.comparisonOperator() ||
            !ctx.value() ||
            (!ctx.fieldExpression() && !ctx.FORMULA() && !ctx.StringLiteral())
        ) {
            throw new Error('値が異常です。FieldExpressionContext: ' + ctx.getText());
        }

        return new WhereFieldExpressionTypeClass(
            ctx.fieldExpression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.fieldExpression()!),
                      isFieldExpressionType,
                      'fieldExpression',
                  )
                : ctx.FORMULA()!.getText() + '(' + ctx.StringLiteral()!.getText() + ')',
            isValidClass(
                new QueryVisitor().visit(ctx.comparisonOperator()),
                isComparisonOperatorType,
                'comparisonOperator',
            ),
            isValidClass(new ValueVisitor().visit(ctx.value()), isNormalValueType, 'value'),
        );
    }
}

export const isWhereFieldExpressionType = (
    target: CommonTypeClass,
): target is WhereFieldExpressionTypeClass => {
    return target instanceof WhereFieldExpressionTypeClass;
};

