import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionListTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ArrayExpressionTypeClass extends ExpressionListTypeClass<
    ExpressionTypeClass<unknown>
> {
    private constructor(
        value: ExpressionTypeClass<unknown>[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('arrayExpression', value, errorClasses);
    }

    static create(ctx: ArrayExpressionContext): ArrayExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ArrayExpressionContext: ' + ctx.getText());
        }

        const value: ExpressionTypeClass<unknown>[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.expression_list().forEach((expressionCtx, index) => {
            const expression = new ExpressionVisitor().visit(expressionCtx);

            if (isExpressionTypeAll(expression)) {
                value.push(expression);
            } else {
                errorClasses[`value_${index}`] = expression;
            }
        });

        return new ArrayExpressionTypeClass(value, errorClasses);
    }
}

export const isArrayExpressionType = (
    target: CommonTypeClass,
): target is ArrayExpressionTypeClass => {
    return target instanceof ArrayExpressionTypeClass;
};
