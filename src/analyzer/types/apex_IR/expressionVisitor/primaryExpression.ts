import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass } from '.';

import { isPrimaryTypeAll, PrimaryTypeClass, PrimaryVisitor } from '../primaryVisitor';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class PrimaryExpressionTypeClass extends ExpressionTypeClass<PrimaryTypeClass> {
    private constructor(
        value: PrimaryTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('primaryExpression', value, errorClasses);
    }

    static create(ctx: PrimaryExpressionContext): PrimaryExpressionTypeClass {
        if (!ctx.primary()) {
            throw new Error('値が異常です。PrimaryExpressionContext: ' + ctx.getText());
        }

        let value: PrimaryTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const primaryTypeClass = new PrimaryVisitor().visit(ctx.primary());
        if (isPrimaryTypeAll(primaryTypeClass)) {
            value = primaryTypeClass;
        } else {
            errorClasses['value'] = primaryTypeClass;
        }

        return new PrimaryExpressionTypeClass(value, errorClasses);
    }
}

export const isPrimaryExpressionType = (
    target: CommonTypeClass,
): target is PrimaryExpressionTypeClass => {
    return target instanceof PrimaryExpressionTypeClass;
};
