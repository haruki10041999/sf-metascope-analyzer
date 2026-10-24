import { Arth1ExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class Arth1ExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'arth1Expression',
    BasedExpressionTypeClass,
    '*' | '/',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionType,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionType,
                'expression',
            ),
            ctx.MUL() ? '*' : '/',
        );
    }
}

export const isArth1ExpressionType = (
    target: CommonTypeClass<string>,
): target is Arth1ExpressionTypeClass => {
    return target instanceof Arth1ExpressionTypeClass;
};
