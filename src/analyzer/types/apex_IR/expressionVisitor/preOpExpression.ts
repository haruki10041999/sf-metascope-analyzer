import { PreOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class PreOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass, operator: string) {
        super('preOpExpression', value, operator);
    }

    static create(ctx: PreOpExpressionContext): PreOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC() && !ctx.ADD() && !ctx.SUB())) {
            throw new Error('値が異常です。PreOpExpressionContext: ' + ctx.getText());
        }

        let operator: string;

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
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            operator,
        );
    }
}

export const isPreOpExpressionType = (
    target: CommonTypeClass,
): target is PreOpExpressionTypeClass => {
    return target instanceof PreOpExpressionTypeClass;
};

