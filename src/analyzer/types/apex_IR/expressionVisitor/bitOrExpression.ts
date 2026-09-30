import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BitOrExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionTypeClass<unknown>,
    ExpressionTypeClass<unknown>
> {
    private constructor(
        left: ExpressionTypeClass<unknown> | null,
        right: ExpressionTypeClass<unknown> | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('bitOrExpression', left, right, operator, errorClasses);
    }

    static create(ctx: BitOrExpressionContext): BitOrExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.BITOR()) {
            throw new Error('値が異常です。BitOrExpressionContext: ' + ctx.getText());
        }

        const leftExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(0));
        const rightExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(1));

        let left: ExpressionTypeClass<unknown> | null = null;
        let right: ExpressionTypeClass<unknown> | null = null;
        const operator: string = '|';
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

        return new BitOrExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isBitOrExpressionType = (
    target: CommonTypeClass,
): target is BitOrExpressionTypeClass => {
    return target instanceof BitOrExpressionTypeClass;
};
