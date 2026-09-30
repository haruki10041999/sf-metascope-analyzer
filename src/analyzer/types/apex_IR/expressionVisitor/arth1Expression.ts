import { Arth1ExpressionContext } from '@apexdevtools/apex-parser';

import {
    OperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class Arth1ExpressionTypeClass extends OperatorExpressionTypeClass {
    private constructor(
        left: ExpressionTypeClass | null,
        right: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('arth1Expression', left, right, operator, errorClasses);
    }

    static create(ctx: Arth1ExpressionContext): Arth1ExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            (!ctx.MUL() && !ctx.DIV())
        ) {
            throw new Error('値が異常です。Arth1ExpressionContext: ' + ctx.getText());
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

        if (ctx.MUL()) {
            operator = '*';
        }
        if (ctx.DIV()) {
            operator = '/';
        }

        return new Arth1ExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isArth1ExpressionType = (
    target: CommonTypeClass,
): target is Arth1ExpressionTypeClass => {
    return target instanceof Arth1ExpressionTypeClass;
};

