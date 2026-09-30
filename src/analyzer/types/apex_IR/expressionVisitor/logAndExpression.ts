import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    OperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class LogAndExpressionTypeClass extends OperatorExpressionTypeClass {
    private constructor(
        left: ExpressionTypeClass | null,
        right: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('logAndExpression', left, right, operator, errorClasses);
    }

    static create(ctx: LogAndExpressionContext): LogAndExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.AND()) {
            throw new Error('値が異常です。LogAndExpressionContext: ' + ctx.getText());
        }

        const leftExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(0));
        const rightExpressionTypeClass = new ExpressionVisitor().visit(ctx.expression(1));

        let left: ExpressionTypeClass | null = null;
        let right: ExpressionTypeClass | null = null;
        const operator = '&&';
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

        return new LogAndExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isLogAndExpressionType = (
    target: CommonTypeClass,
): target is LogAndExpressionTypeClass => {
    return target instanceof LogAndExpressionTypeClass;
};

