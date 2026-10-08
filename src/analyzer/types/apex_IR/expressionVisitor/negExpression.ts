import { NegExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class NegExpressionTypeClass extends SingleOperatorExpressionTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass, operator: string) {
        super('negExpression', value, operator);
    }

    static create(ctx: NegExpressionContext): NegExpressionTypeClass {
        if (!ctx.expression() || (!ctx.TILDE() && !ctx.BANG())) {
            throw new Error('値が異常です。NegExpressionContext: ' + ctx.getText());
        }

        return new NegExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            ctx.TILDE() ? '~' : '!',
        );
    }
}

export const isNegExpressionType = (target: CommonTypeClass): target is NegExpressionTypeClass => {
    return target instanceof NegExpressionTypeClass;
};

