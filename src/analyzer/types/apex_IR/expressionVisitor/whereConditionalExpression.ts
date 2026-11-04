import { WhereConditionalExpressionContext } from '@apexdevtools/apex-parser';

import {
    WhereLogicalExpressionTypeClass,
    WhereFieldExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isWhereLogicalExpressionType,
    isWhereFieldExpressionType,
} from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, isApexValidClass } from '../commonVisitor';

export class WhereConditionalExpressionTypeClass extends ExpressionTypeClass<
    'whereConditionalExpression',
    WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass
> {
    private constructor(
        value: WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('whereConditionalExpression', value);
    }

    static create(ctx: WhereConditionalExpressionContext): WhereConditionalExpressionTypeClass {
        if (!ctx.whereLogicalExpression() && !ctx.whereFieldExpression()) {
            throw new Error('値が異常です。WhereConditionalExpressionContext: ' + ctx.getText());
        }

        return new WhereConditionalExpressionTypeClass(
            ctx.whereLogicalExpression()
                ? isApexValidClass(
                      new ExpressionVisitor().visit(ctx.whereLogicalExpression()),
                      isWhereLogicalExpressionType,
                      'whereLogicalExpression',
                  )
                : isApexValidClass(
                      new ExpressionVisitor().visit(ctx.whereFieldExpression()),
                      isWhereFieldExpressionType,
                      'whereFieldExpression',
                  ),
        );
    }
}

export const isWhereConditionalExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is WhereConditionalExpressionTypeClass => {
    return target instanceof WhereConditionalExpressionTypeClass;
};

