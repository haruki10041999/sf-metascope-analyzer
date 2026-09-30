import { BitExpressionContext } from '@apexdevtools/apex-parser';

import {
    OperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class BitExpressionTypeClass extends OperatorExpressionTypeClass {
    private constructor(
        left: ExpressionTypeClass | null,
        right: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('bitExpression', left, right, operator, errorClasses);
    }

    static create(ctx: BitExpressionContext): BitExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            ((!ctx.LT_list() || ctx.LT_list().length === 0) &&
                (!ctx.GT_list() || ctx.GT_list().length === 0))
        ) {
            throw new Error('値が異常です。BitExpressionContext: ' + ctx.getText());
        }

        const leftExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(0));
        const rightExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(1));

        let left: ExpressionTypeClass | null = null;
        let right: ExpressionTypeClass | null = null;
        let operator: string | null = null;
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

        if (ctx.LT_list() && ctx.LT_list().length > 0) {
            operator = ctx
                .LT_list()
                .map((node) => node.getText())
                .join('');
        }

        if (ctx.GT_list() && ctx.GT_list().length > 0) {
            operator = ctx
                .GT_list()
                .map((node) => node.getText())
                .join('');
        }

        return new BitExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isBitExpressionType = (target: CommonTypeClass): target is BitExpressionTypeClass => {
    return target instanceof BitExpressionTypeClass;
};

