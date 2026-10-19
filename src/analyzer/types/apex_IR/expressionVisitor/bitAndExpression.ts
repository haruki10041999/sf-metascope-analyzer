import { BitAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class BitAndExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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

export const isBitAndExpressionType = (
    target: CommonTypeClass,
): target is BitAndExpressionTypeClass => {
    return target instanceof BitAndExpressionTypeClass;
};
