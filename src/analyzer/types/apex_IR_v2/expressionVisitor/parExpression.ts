import { ParExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, visitNode } from '../commonVisitor';

export class ParExpressionTypeClass extends ExpressionTypeClass<
    'parExpression',
    BasedExpressionTypeClass
> {
    private constructor(value: BasedExpressionTypeClass | ApexErrorTypeClass) {
        super('parExpression', value);
    }

    static create(ctx: ParExpressionContext): ParExpressionTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ParExpressionContext: ' + ctx.getText());
        }

        return new ParExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isParExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is ParExpressionTypeClass => {
    return target instanceof ParExpressionTypeClass;
};
