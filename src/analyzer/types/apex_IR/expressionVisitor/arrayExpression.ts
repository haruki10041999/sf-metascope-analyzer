import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionListTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class ArrayExpressionTypeClass extends ExpressionListTypeClass<ExpressionAllTypeClass> {
    private constructor(value: (ExpressionAllTypeClass | ErrorTypeClass)[]) {
        super('arrayExpression', value);
    }

    static create(ctx: ArrayExpressionContext): ArrayExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length === 0) {
            throw new Error('値が異常です。ArrayExpressionContext: ' + ctx.getText());
        }

        return new ArrayExpressionTypeClass(
            ctx.expression_list().map((expressionCtx) => {
                return isValidClass(
                    new ExpressionVisitor().visit(expressionCtx),
                    isExpressionTypeAll,
                    'expression',
                );
            }),
        );
    }
}

export const isArrayExpressionType = (
    target: CommonTypeClass,
): target is ArrayExpressionTypeClass => {
    return target instanceof ArrayExpressionTypeClass;
};
