import { BitNotExpressionContext } from '@apexdevtools/apex-parser';
import {
    DoubleOperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BitNotExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionTypeClass<unknown>,
    ExpressionTypeClass<unknown>
> {
    private constructor(
        left: ExpressionTypeClass<unknown> | null,
        right: ExpressionTypeClass<unknown> | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('bitNotExpression', left, right, '^', errorClasses);
    }

    static create(ctx: BitNotExpressionContext): BitNotExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.CARET()) {
            throw new Error('値が異常です。BitNotExpressionContext: ' + ctx.getText());
        }

        const leftExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(0));
        const rightExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(1));

        let left: ExpressionTypeClass<unknown> | null = null;
        let right: ExpressionTypeClass<unknown> | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(leftExpressionTypeClass)) {
            left = leftExpressionTypeClass;
        } else {
            errorTypeClasses['left'] = leftExpressionTypeClass;
        }

        if (isExpressionTypeAll(rightExpressionTypeClass)) {
            right = rightExpressionTypeClass;
        } else {
            errorTypeClasses['right'] = rightExpressionTypeClass;
        }

        return new BitNotExpressionTypeClass(left, right, errorTypeClasses);
    }
}

export const isBitNotExpressionType = (
    target: CommonTypeClass,
): target is BitNotExpressionTypeClass => {
    return target instanceof BitNotExpressionTypeClass;
};

