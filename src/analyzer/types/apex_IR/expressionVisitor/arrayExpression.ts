import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionType } from '.';

import { ErrorTypeClass } from '../commonVisitor';

export class ArrayExpressionTypeClass extends ExpressionTypeClass {
    private constructor(value: ExpressionTypeClass[], errorClasses: ErrorTypeClass[]) {
        super('arrayExpression', value, errorClasses);
    }

    static create(ctx: ArrayExpressionContext): ArrayExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ArrayExpressionContext: ' + ctx.getText());
        }

        const value: ExpressionTypeClass[] = [];
        const errorClasses: ErrorTypeClass[] = [];

        ctx.expression_list().forEach((expressionCtx) => {
            const expression = new ExpressionVisitor().visit(expressionCtx);

            if (isExpressionType(expression)) {
                value.push(expression);
            } else {
                errorClasses.push(expression);
            }
        });

        return new ArrayExpressionTypeClass(value, errorClasses);
    }
}

export const isArrayExpressionType = (
    target: ArrayExpressionTypeClass,
): target is ArrayExpressionTypeClass => {
    return target instanceof ArrayExpressionTypeClass;
};
