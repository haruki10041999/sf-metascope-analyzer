import { ArrayExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, visitNode } from '../commonVisitor';

export class ArrayExpressionTypeClass extends ExpressionTypeClass<
    'arrayExpression',
    BasedExpressionTypeClass
> {
    private index: BasedExpressionTypeClass | ApexErrorTypeClass;

    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        index: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('arrayExpression', value);
        this.index = index;
    }

    static create(ctx: ArrayExpressionContext): ArrayExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2) {
            throw new Error('値が異常です。ArrayExpressionContext: ' + ctx.getText());
        }

        return new ArrayExpressionTypeClass(
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
        );
    }

    getIndex(): BasedExpressionTypeClass | ApexErrorTypeClass {
        return this.index;
    }
}

export const isArrayExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is ArrayExpressionTypeClass => {
    return target instanceof ArrayExpressionTypeClass;
};
