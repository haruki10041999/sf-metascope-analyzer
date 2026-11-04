import { NegExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class NegExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    'negExpression',
    BasedExpressionTypeClass,
    '~' | '!'
> {
    private constructor(value: BasedExpressionTypeClass | ApexErrorTypeClass, operator: '~' | '!') {
        super('negExpression', value, operator);
    }

    static create(ctx: NegExpressionContext): NegExpressionTypeClass {
        if (!ctx.expression() || (!ctx.TILDE() && !ctx.BANG())) {
            throw new Error('値が異常です。NegExpressionContext: ' + ctx.getText());
        }

        return new NegExpressionTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
            ctx.TILDE() ? '~' : '!',
        );
    }
}

export const isNegExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is NegExpressionTypeClass => {
    return target instanceof NegExpressionTypeClass;
};

