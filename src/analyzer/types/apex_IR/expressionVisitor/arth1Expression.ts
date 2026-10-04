import { Arth1ExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class Arth1ExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
        operator: string,
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
                isExpressionTypeAll,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isExpressionTypeAll,
                'expression',
            ),
            ctx.MUL() ? '*' : '/',
        );
    }
}

export const isArth1ExpressionType = (
    target: CommonTypeClass,
): target is Arth1ExpressionTypeClass => {
    return target instanceof Arth1ExpressionTypeClass;
};
