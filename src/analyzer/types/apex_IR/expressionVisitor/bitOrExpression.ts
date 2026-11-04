import { BitOrExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class BitOrExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'bitOrExpression',
    BasedExpressionTypeClass,
    '|',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('bitOrExpression', left, right, '|');
    }

    static create(ctx: BitOrExpressionContext): BitOrExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.BITOR()) {
            throw new Error('値が異常です。BitOrExpressionContext: ' + ctx.getText());
        }

        return new BitOrExpressionTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionType,
                'expression',
            ),
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isBitOrExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is BitOrExpressionTypeClass => {
    return target instanceof BitOrExpressionTypeClass;
};

