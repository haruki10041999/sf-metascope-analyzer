import { SubExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, visitNode } from '../commonVisitor';

export class SubExpressionTypeClass extends ExpressionTypeClass<
    'subExpression',
    BasedExpressionTypeClass
> {
    private constructor(value: BasedExpressionTypeClass | ApexErrorTypeClass) {
        super('subExpression', value);
    }

    static create(ctx: SubExpressionContext): SubExpressionTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。SubExpressionContext: ' + ctx.getText());
        }

        return new SubExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isSubExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is SubExpressionTypeClass => {
    return target instanceof SubExpressionTypeClass;
};
