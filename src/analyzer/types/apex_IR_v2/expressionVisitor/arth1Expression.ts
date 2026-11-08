import { Arth1ExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class Arth1ExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'arth1Expression',
    BasedExpressionTypeClass,
    '*' | '/',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
        operator: '*' | '/',
    ) {
        super('arth1Expression', left, right, operator);
    }

    static create(ctx: Arth1ExpressionContext): Arth1ExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            (!ctx.MUL() && !ctx.DIV())
        ) {
            throw new Error('値が異常です。Arth1ExpressionContext: ' + ctx.getText());
        }

        return new Arth1ExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(0),
                isBasedExpressionType,
                'expression',
            ),
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(1),
                isBasedExpressionType,
                'expression',
            ),
            ctx.MUL() ? '*' : '/',
        );
    }
}

export const isArth1ExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is Arth1ExpressionTypeClass => {
    return target instanceof Arth1ExpressionTypeClass;
};
