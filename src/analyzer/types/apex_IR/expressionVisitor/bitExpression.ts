import { BitExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class BitExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    'bitExpression',
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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
        let operator: string = '';

        if (ctx.LT_list() && ctx.LT_list().length > 0) {
            operator = ctx
                .LT_list()
                .map((node) => node.getText())
                .join('');
        }

        if (ctx.GT_list() && ctx.GT_list().length > 0) {
            operator = ctx
                .GT_list()
                .map((node) => node.getText())
                .join('');
        }

        return new BitExpressionTypeClass(
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
            operator,
        );
    }
}

export const isBitExpressionType = (
    target: CommonTypeClass<string>,
): target is BitExpressionTypeClass => {
    return target instanceof BitExpressionTypeClass;
};
