import { BitNotExpressionContext } from '@apexdevtools/apex-parser';
import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class BitNotExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'bitNotExpression',
    BasedExpressionTypeClass,
    '^',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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

export const isBitNotExpressionType = (
    target: CommonTypeClass<string>,
): target is BitNotExpressionTypeClass => {
    return target instanceof BitNotExpressionTypeClass;
};
