import { BoundExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class BoundExpressionTypeClass extends ExpressionTypeClass<unknown> {
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('boundExpression', value, errorClasses);
    }

    static create(ctx: BoundExpressionContext): BoundExpressionTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。BoundExpressionContext: ' + ctx);
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let value: ExpressionTypeClass<unknown> | null = null;
        let errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorTypeClasses['value'] = expressionTypeClass;
        }

        return new BoundExpressionTypeClass(value, errorTypeClasses);
    }
}

export const isBoundExpressionType = (
    target: CommonTypeClass,
): target is BoundExpressionTypeClass => {
    return target instanceof BoundExpressionTypeClass;
};
