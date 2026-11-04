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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class WhereFieldExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    'whereFieldExpression',
    FieldExpressionTypeClass | string,
    ComparisonOperatorTypeClass | null,
    NormalValueTypeClass | null
> {
    private constructor(
        left: FieldExpressionTypeClass | string | ApexErrorTypeClass,
        operator: ComparisonOperatorTypeClass | ApexErrorTypeClass | null,
        right: NormalValueTypeClass | ApexErrorTypeClass | null,
    ) {
        super('whereFieldExpression', left, right, operator);
    }

    // 文法は `fieldExpression | FORMULA ( StringLiteral ) comparisonOperator value` の 2 択。
    // 前者は fieldExpression 自体が演算子と値を持つため operator / right は null
    static create(ctx: WhereFieldExpressionContext): WhereFieldExpressionTypeClass {
        const fieldExpression = ctx.fieldExpression();
        if (fieldExpression) {
            return new WhereFieldExpressionTypeClass(
                isApexValidClass(
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
            isApexValidClass(
                new QueryVisitor().visit(ctx.comparisonOperator()),
                isComparisonOperatorType,
                'comparisonOperator',
            ),
            isApexValidClass(new ValueVisitor().visit(ctx.value()), isNormalValueType, 'value'),
        );
    }
}

export const isWhereFieldExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is WhereFieldExpressionTypeClass => {
    return target instanceof WhereFieldExpressionTypeClass;
};

