import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { BasedPrimaryTypeClass, PrimaryVisitor, isBasedPrimaryType } from '../primaryVisitor';

import { ApexCommonTypeClass, ApexErrorTypeClass, visitNode } from '../commonVisitor';

export class PrimaryExpressionTypeClass extends ExpressionTypeClass<
    'primaryExpression',
    BasedPrimaryTypeClass
> {
    private constructor(value: BasedPrimaryTypeClass | ApexErrorTypeClass) {
        super('primaryExpression', value);
    }

    static create(ctx: PrimaryExpressionContext): PrimaryExpressionTypeClass {
        if (!ctx.primary()) {
            throw new Error('値が異常です。PrimaryExpressionContext: ' + ctx.getText());
        }

        return new PrimaryExpressionTypeClass(
            visitNode(new PrimaryVisitor(), ctx.primary(), isBasedPrimaryType, 'primary'),
        );
    }
}

export const isPrimaryExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is PrimaryExpressionTypeClass => {
    return target instanceof PrimaryExpressionTypeClass;
};
