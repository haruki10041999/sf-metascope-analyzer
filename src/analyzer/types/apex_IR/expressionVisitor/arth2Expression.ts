import { Arth2ExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class Arth2ExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    string,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
        operator: string,
    ) {
        super('arth2Expression', left, right, operator);
    }

    static create(ctx: Arth2ExpressionContext): Arth2ExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            (!ctx.ADD() && !ctx.SUB())
        ) {
            throw new Error('値が異常です。Arth2ExpressionContext: ' + ctx.getText());
        }

        return new Arth2ExpressionTypeClass(
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
            ctx.ADD() ? '+' : '-',
        );
    }
}

export const isArth2ExpressionType = (
    target: CommonTypeClass,
): target is Arth2ExpressionTypeClass => {
    return target instanceof Arth2ExpressionTypeClass;
};

