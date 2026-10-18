import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class ArrayExpressionTypeClass extends ExpressionTypeClass<ExpressionAllTypeClass> {
    private index: ExpressionAllTypeClass | ErrorTypeClass;

    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
        index: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('arrayExpression', value);
        this.index = index;
    }

    static create(ctx: ArrayExpressionContext): ArrayExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。ArrayExpressionContext: ' + ctx.getText());
        }

        return new ArrayExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isExpressionTypeAll,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }

    getIndex(): ExpressionAllTypeClass | ErrorTypeClass {
        return this.index;
    }
}

export const isArrayExpressionType = (
    target: CommonTypeClass,
): target is ArrayExpressionTypeClass => {
    return target instanceof ArrayExpressionTypeClass;
};
