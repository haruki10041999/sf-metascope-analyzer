import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CoalExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    string,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('coalExpression', left, right, '??');
    }

    static create(ctx: CoalExpressionContext): CoalExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.COAL()) {
            throw new Error('値が異常です。CoalExpressionContext: ' + ctx.getText());
        }

        return new CoalExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isExpressionTypeAll,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isCoalExpressionType = (
    target: CommonTypeClass,
): target is CoalExpressionTypeClass => {
    return target instanceof CoalExpressionTypeClass;
};

