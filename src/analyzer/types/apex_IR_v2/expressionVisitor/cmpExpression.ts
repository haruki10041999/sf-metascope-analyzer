import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class CmpExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'cmpExpression',
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
        operator: string,
    ) {
        super('cmpExpression', left, right, operator);
    }

    static create(ctx: CmpExpressionContext): CmpExpressionTypeClass {
        if (ctx.expression_list().length !== 2 || (!ctx.GT() && !ctx.LT())) {
            throw new Error('値が異常です。CmpExpressionContext: ' + ctx.getText());
        }

        return new CmpExpressionTypeClass(
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
            // `<=` / `>=` は LT/GT と ASSIGN の 2 トークンで表現される
            (ctx.GT() ? '>' : '<') + (ctx.ASSIGN() ? '=' : ''),
        );
    }
}

export const isCmpExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is CmpExpressionTypeClass => {
    return target instanceof CmpExpressionTypeClass;
};
