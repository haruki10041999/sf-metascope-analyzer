import { BoundExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class BoundExpressionTypeClass extends ExpressionTypeClass<
    'boundExpression',
    BasedExpressionTypeClass
> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass) {
        super('boundExpression', value);
    }

    static create(ctx: BoundExpressionContext): BoundExpressionTypeClass {
        if (!ctx.expression() || !ctx.COLON()) {
            throw new Error('値が異常です。BoundExpressionContext: ' + ctx.getText());
        }

        return new BoundExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isBoundExpressionType = (
    target: CommonTypeClass<string>,
): target is BoundExpressionTypeClass => {
    return target instanceof BoundExpressionTypeClass;
};
