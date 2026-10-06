import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { PrimaryTypeClass, PrimaryVisitor, isPrimaryTypeAll } from '../primaryVisitor';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class PrimaryExpressionTypeClass extends ExpressionTypeClass<PrimaryTypeClass<unknown>> {
    private constructor(value: PrimaryTypeClass<unknown> | ErrorTypeClass) {
        super('primaryExpression', value);
    }

    static create(ctx: PrimaryExpressionContext): PrimaryExpressionTypeClass {
        if (!ctx.primary()) {
            throw new Error('値が異常です。PrimaryExpressionContext: ' + ctx.getText());
        }

        return new PrimaryExpressionTypeClass(
            isValidClass(new PrimaryVisitor().visit(ctx.primary()), isPrimaryTypeAll, 'primary'),
        );
    }
}

export const isPrimaryExpressionType = (
    target: CommonTypeClass,
): target is PrimaryExpressionTypeClass => {
    return target instanceof PrimaryExpressionTypeClass;
};

