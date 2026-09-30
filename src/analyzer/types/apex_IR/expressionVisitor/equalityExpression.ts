import { EqualityExpressionContext } from '@apexdevtools/apex-parser';

import {
    OperatorExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class EqualityExpressionTypeClass extends OperatorExpressionTypeClass {
    private constructor(
        left: ExpressionTypeClass | null,
        right: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('equalityExpression', left, right, operator, errorClasses);
    }

    static create(ctx: EqualityExpressionContext): EqualityExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            !(
                ctx.TRIPLEEQUAL() ||
                ctx.TRIPLENOTEQUAL() ||
                ctx.EQUAL() ||
                ctx.NOTEQUAL() ||
                ctx.LESSANDGREATER()
            )
        ) {
            throw new Error('値が異常です。EqualityExpressionContext: ' + ctx.getText());
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

        if (ctx.TRIPLEEQUAL()) {
            operator = '===';
        }
        if (ctx.TRIPLENOTEQUAL()) {
            operator = '!==';
        }
        if (ctx.EQUAL()) {
            operator = '==';
        }
        if (ctx.NOTEQUAL()) {
            operator = '!=';
        }
        if (ctx.LESSANDGREATER()) {
            operator = '<>';
        }

        return new EqualityExpressionTypeClass(left, right, operator, errorTypeClasses);
    }
}

export const isEqualityExpressionType = (
    target: CommonTypeClass,
): target is EqualityExpressionTypeClass => {
    return target instanceof EqualityExpressionTypeClass;
};

