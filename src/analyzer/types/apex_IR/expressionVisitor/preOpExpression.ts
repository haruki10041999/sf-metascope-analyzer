import { PreOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PreOpExpressionTypeClass extends SingleOperatorExpressionTypeClass {
    private constructor(
        literal: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('preOpExpression', literal, operator, errorClasses);
    }

    static create(ctx: PreOpExpressionContext): PreOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC() && !ctx.ADD() && !ctx.SUB())) {
            throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let literal: ExpressionTypeClass | null = null;
        let operator: string | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            literal = expressionTypeClass;
        } else {
            errorTypeClasses['literal'] = expressionTypeClass;
        }

        if (ctx.INC()) {
            operator = '++';
        }
        if (ctx.DEC()) {
            operator = '--';
        }
        if (ctx.ADD()) {
            operator = '+';
        }
        if (ctx.SUB()) {
            operator = '-';
        }

        return new PreOpExpressionTypeClass(literal, operator, errorTypeClasses);
    }
}

export const isPreOpExpressionType = (
    target: CommonTypeClass,
): target is PreOpExpressionTypeClass => {
    return target instanceof PreOpExpressionTypeClass;
};

