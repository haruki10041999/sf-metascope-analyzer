import { BitAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class BitAndExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'bitAndExpression',
    BasedExpressionTypeClass,
    '&',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('bitAndExpression', left, right, '&');
    }

    static create(ctx: BitAndExpressionContext): BitAndExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.BITAND()) {
            throw new Error('値が異常です。BitAndExpressionContext: ' + ctx.getText());
        }

        return new BitAndExpressionTypeClass(
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

export const isBitAndExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is BitAndExpressionTypeClass => {
    return target instanceof BitAndExpressionTypeClass;
};

