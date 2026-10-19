import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class BitOrExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
    ) {
        super('bitOrExpression', left, right, '|');
    }

    static create(ctx: BitOrExpressionContext): BitOrExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.BITOR()) {
            throw new Error('値が異常です。BitOrExpressionContext: ' + ctx.getText());
        }

        return new BitOrExpressionTypeClass(
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
        );
    }
}

export const isBitOrExpressionType = (
    target: CommonTypeClass,
): target is BitOrExpressionTypeClass => {
    return target instanceof BitOrExpressionTypeClass;
};
