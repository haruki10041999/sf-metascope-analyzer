import { BitNotExpressionContext } from '@apexdevtools/apex-parser';
import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class BitNotExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('bitNotExpression', left, right, '^');
    }

    static create(ctx: BitNotExpressionContext): BitNotExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.CARET()) {
            throw new Error('値が異常です。BitNotExpressionContext: ' + ctx.getText());
        }

        return new BitNotExpressionTypeClass(
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
        );
    }
}

export const isBitNotExpressionType = (
    target: CommonTypeClass,
): target is BitNotExpressionTypeClass => {
    return target instanceof BitNotExpressionTypeClass;
};
