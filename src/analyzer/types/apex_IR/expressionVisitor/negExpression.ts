import { NegExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class NegExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    ExpressionTypeClass<unknown>
> {
    private constructor(
        literal: ExpressionTypeClass<unknown> | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('negExpression', literal, operator, errorClasses);
    }

    static create(ctx: NegExpressionContext): NegExpressionTypeClass {
        if (!ctx.expression() || (!ctx.TILDE() && !ctx.BANG())) {
            throw new Error('値が異常です。NegExpressionContext: ' + ctx.getText());
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let literal: ExpressionTypeClass<unknown> | null = null;
        let operator: string | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            literal = expressionTypeClass;
        } else {
            errorTypeClasses['literal'] = expressionTypeClass;
        }

        if (ctx.TILDE()) {
            operator = '~';
        }
        if (ctx.BANG()) {
            operator = '!';
        }

        return new NegExpressionTypeClass(literal, operator, errorTypeClasses);
    }
}

export const isNegExpressionType = (target: CommonTypeClass): target is NegExpressionTypeClass => {
    return target instanceof NegExpressionTypeClass;
};
