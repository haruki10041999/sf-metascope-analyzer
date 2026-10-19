import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { BasedPrimaryTypeClass, PrimaryVisitor, isBasedPrimaryType } from '../primaryVisitor';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class PrimaryExpressionTypeClass extends ExpressionTypeClass<BasedPrimaryTypeClass> {
    private constructor(value: BasedPrimaryTypeClass | ErrorTypeClass) {
        super('primaryExpression', value);
    }

    static create(ctx: PrimaryExpressionContext): PrimaryExpressionTypeClass {
        if (!ctx.primary()) {
            throw new Error('値が異常です。PrimaryExpressionContext: ' + ctx.getText());
        }

        return new PrimaryExpressionTypeClass(
            isValidClass(new PrimaryVisitor().visit(ctx.primary()), isBasedPrimaryType, 'primary'),
        );
    }
}

export const isPrimaryExpressionType = (
    target: CommonTypeClass,
): target is PrimaryExpressionTypeClass => {
    return target instanceof PrimaryExpressionTypeClass;
};

