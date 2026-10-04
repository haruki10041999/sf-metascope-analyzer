import { BitAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class BitAndExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('bitAndExpression', left, right, '&');
    }

    static create(ctx: BitAndExpressionContext): BitAndExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.BITAND()) {
            throw new Error('値が異常です。BitAndExpressionContext: ' + ctx.getText());
        }

        return new BitAndExpressionTypeClass(
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

export const isBitAndExpressionType = (
    target: CommonTypeClass,
): target is BitAndExpressionTypeClass => {
    return target instanceof BitAndExpressionTypeClass;
};
