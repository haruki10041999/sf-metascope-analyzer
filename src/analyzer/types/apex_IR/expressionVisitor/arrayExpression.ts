import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class ArrayExpressionTypeClass extends ExpressionTypeClass<BasedExpressionTypeClass> {
    private index: BasedExpressionTypeClass | ErrorTypeClass;

    private constructor(
        value: BasedExpressionTypeClass | ErrorTypeClass,
        index: BasedExpressionTypeClass | ErrorTypeClass,
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
                isBasedExpressionTypeClass,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionTypeClass,
                'expression',
            ),
        );
    }

    getIndex(): BasedExpressionTypeClass | ErrorTypeClass {
        return this.index;
    }
}

export const isArrayExpressionType = (
    target: CommonTypeClass,
): target is ArrayExpressionTypeClass => {
    return target instanceof ArrayExpressionTypeClass;
};

