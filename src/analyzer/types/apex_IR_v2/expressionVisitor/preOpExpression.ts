import { PreOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class PreOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    'preOpExpression',
    BasedExpressionTypeClass,
    '++' | '--' | '+' | '-'
> {
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        operator: '++' | '--' | '+' | '-',
    ) {
        super('preOpExpression', value, operator);
    }

    static create(ctx: PreOpExpressionContext): PreOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC() && !ctx.ADD() && !ctx.SUB())) {
            throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
        }

        let operator: '++' | '--' | '+' | '-';

        if (ctx.INC()) {
            operator = '++';
        } else if (ctx.DEC()) {
            operator = '--';
        } else if (ctx.ADD()) {
            operator = '+';
        } else {
            operator = '-';
        }

        return new PreOpExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            operator,
        );
    }
}

export const isPreOpExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is PreOpExpressionTypeClass => {
    return target instanceof PreOpExpressionTypeClass;
};
