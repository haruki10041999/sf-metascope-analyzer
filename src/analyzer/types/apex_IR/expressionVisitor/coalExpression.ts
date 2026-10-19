import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CoalExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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

export const isCoalExpressionType = (
    target: CommonTypeClass,
): target is CoalExpressionTypeClass => {
    return target instanceof CoalExpressionTypeClass;
};
