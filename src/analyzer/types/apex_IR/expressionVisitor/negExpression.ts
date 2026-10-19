import { NegExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class NegExpressionTypeClass extends SingleOperatorExpressionTypeClass<BasedExpressionTypeClass> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass, operator: string) {
        super('negExpression', value, operator);
    }

    static create(ctx: NegExpressionContext): NegExpressionTypeClass {
        if (!ctx.expression() || (!ctx.TILDE() && !ctx.BANG())) {
            throw new Error('値が異常です。NegExpressionContext: ' + ctx.getText());
        }

        return new NegExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
            ctx.TILDE() ? '~' : '!',
        );
    }
}

export const isNegExpressionType = (target: CommonTypeClass): target is NegExpressionTypeClass => {
    return target instanceof NegExpressionTypeClass;
};
