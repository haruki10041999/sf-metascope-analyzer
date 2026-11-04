import { CoalExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class CoalExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'coalExpression',
    BasedExpressionTypeClass,
    '??',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('coalExpression', left, right, '??');
    }

    static create(ctx: CoalExpressionContext): CoalExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.COAL()) {
            throw new Error('値が異常です。CoalExpressionContext: ' + ctx.getText());
        }

        return new CoalExpressionTypeClass(
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

export const isCoalExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is CoalExpressionTypeClass => {
    return target instanceof CoalExpressionTypeClass;
};

