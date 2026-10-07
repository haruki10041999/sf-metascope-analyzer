import { WhereConditionalExpressionContext } from '@apexdevtools/apex-parser';

import {
    WhereLogicalExpressionTypeClass,
    WhereFieldExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isWhereLogicalExpressionType,
    isWhereFieldExpressionType,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class WhereConditionalExpressionTypeClass extends ExpressionTypeClass<
    WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass
> {
    private constructor(
        value: WhereLogicalExpressionTypeClass | WhereFieldExpressionTypeClass | ErrorTypeClass,
    ) {
        super('whereConditionalExpression', value);
    }

    static create(ctx: WhereConditionalExpressionContext): WhereConditionalExpressionTypeClass {
        if (!ctx.whereLogicalExpression() && !ctx.whereFieldExpression()) {
            throw new Error('値が異常です。WhereConditionalExpressionContext: ' + ctx.getText());
        }

        return new WhereConditionalExpressionTypeClass(
            ctx.whereLogicalExpression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.whereLogicalExpression()),
                      isWhereLogicalExpressionType,
                      'whereLogicalExpression',
                  )
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.whereFieldExpression()),
                      isWhereFieldExpressionType,
                      'whereFieldExpression',
                  ),
        );
    }
}

export const isWhereConditionalExpressionType = (
    target: CommonTypeClass,
): target is WhereConditionalExpressionTypeClass => {
    return target instanceof WhereConditionalExpressionTypeClass;
};

