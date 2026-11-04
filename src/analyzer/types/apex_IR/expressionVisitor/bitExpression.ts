import { BitExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class BitExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'bitExpression',
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
        operator: string,
    ) {
        super('bitExpression', left, right, operator);
    }

    static create(ctx: BitExpressionContext): BitExpressionTypeClass {
        if (
            !ctx.expression_list() ||
            ctx.expression_list().length !== 2 ||
            ((!ctx.LT_list() || ctx.LT_list().length === 0) &&
                (!ctx.GT_list() || ctx.GT_list().length === 0))
        ) {
            throw new Error('値が異常です。BitExpressionContext: ' + ctx.getText());
        }
        let operator: string;

        if (ctx.LT_list() && ctx.LT_list().length > 0) {
            operator = ctx
                .LT_list()
                .map((node) => node.getText())
                .join('');
        } else {
            operator = ctx
                .GT_list()
                .map((node) => node.getText())
                .join('');
        }

        return new BitExpressionTypeClass(
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
            operator,
        );
    }
}

export const isBitExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is BitExpressionTypeClass => {
    return target instanceof BitExpressionTypeClass;
};

