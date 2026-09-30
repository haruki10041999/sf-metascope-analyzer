import { PreOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PreOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    ExpressionTypeClass<unknown>
> {
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('preOpExpression', value, operator, errorClasses);
    }

    static create(ctx: PreOpExpressionContext): PreOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC() && !ctx.ADD() && !ctx.SUB())) {
            throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let value: ExpressionTypeClass<unknown> | null = null;
        let operator: string | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorTypeClasses['value'] = expressionTypeClass;
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

        return new PreOpExpressionTypeClass(value, operator, errorTypeClasses);
    }
}

export const isPreOpExpressionType = (
    target: CommonTypeClass,
): target is PreOpExpressionTypeClass => {
    return target instanceof PreOpExpressionTypeClass;
};
