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
    ComparisonOperatorTypeClass | null,
    NormalValueTypeClass | null
> {
    private constructor(
        left: FieldExpressionTypeClass | string | ErrorTypeClass,
        operator: ComparisonOperatorTypeClass | ErrorTypeClass | null,
        right: NormalValueTypeClass | ErrorTypeClass | null,
    ) {
        super('whereFieldExpression', left, right, operator);
    }

    // 文法は `fieldExpression | FORMULA ( StringLiteral ) comparisonOperator value` の 2 択。
    // 前者は fieldExpression 自体が演算子と値を持つため operator / right は null
    static create(ctx: WhereFieldExpressionContext): WhereFieldExpressionTypeClass {
        const fieldExpression = ctx.fieldExpression();
        if (fieldExpression) {
            return new WhereFieldExpressionTypeClass(
                isValidClass(
                    new ExpressionVisitor().visit(fieldExpression),
                    isFieldExpressionType,
                    'fieldExpression',
                ),
                null,
                null,
            );
        }

        if (!ctx.FORMULA() || !ctx.StringLiteral() || !ctx.comparisonOperator() || !ctx.value()) {
            throw new Error('値が異常です。WhereFieldExpressionContext: ' + ctx.getText());
        }

        return new WhereFieldExpressionTypeClass(
            ctx.FORMULA().getText() + '(' + ctx.StringLiteral().getText() + ')',
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

