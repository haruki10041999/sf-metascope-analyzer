import { ParExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ParExpressionTypeClass extends ExpressionTypeClass {
    private constructor(
        value: ExpressionTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('parExpression', value, errorClasses);
    }

    static create(ctx: ParExpressionContext): ParExpressionTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。ParExpressionContext: ' + ctx);
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let value: ExpressionTypeClass | null = null;
        let errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorTypeClasses['value'] = expressionTypeClass;
        }

        return new ParExpressionTypeClass(value, errorTypeClasses);
    }
}

export const isParExpressionType = (target: CommonTypeClass): target is ParExpressionTypeClass => {
    return target instanceof ParExpressionTypeClass;
};
