import { BitNotExpressionContext } from '@apexdevtools/apex-parser';
import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class BitNotExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'bitNotExpression',
    BasedExpressionTypeClass,
    '^',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('bitNotExpression', left, right, '^');
    }

    static create(ctx: BitNotExpressionContext): BitNotExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.CARET()) {
            throw new Error('値が異常です。BitNotExpressionContext: ' + ctx.getText());
        }

        return new BitNotExpressionTypeClass(
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
        );
    }
}

export const isBitNotExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is BitNotExpressionTypeClass => {
    return target instanceof BitNotExpressionTypeClass;
};
