import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import {
    OperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class CmpExpressionTypeClass extends OperatorExpressionTypeClass {
    private constructor(
        left: ExpressionTypeClass | null,
        right: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('cmpExpression', left, right, operator, errorClasses);
    }

    static create(ctx: CmpExpressionContext): CmpExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            (!ctx.ASSIGN() && !ctx.GT() && !ctx.LT())
        ) {
            throw new Error('値が異常です。CmpExpressionContext: ' + ctx.getText());
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

        if (ctx.ASSIGN()) {
            operator = '=';
        }
        if (ctx.GT()) {
            operator = '>';
        }
        if (ctx.LT()) {
            operator = '<';
        }

        return new CmpExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isCmpExpressionType = (target: CommonTypeClass): target is CmpExpressionTypeClass => {
    return target instanceof CmpExpressionTypeClass;
};

