import { SubExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class SubExpressionTypeClass extends ExpressionTypeClass {
    private constructor(
        value: ExpressionTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('subExpression', value, errorClasses);
    }

    static create(ctx: SubExpressionContext): SubExpressionTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。SubExpressionContext: ' + ctx);
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let value: ExpressionTypeClass | null = null;
        let errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorTypeClasses['value'] = expressionTypeClass;
        }

        return new SubExpressionTypeClass(value, errorTypeClasses);
    }
}

export const isSubExpressionType = (target: CommonTypeClass): target is SubExpressionTypeClass => {
    return target instanceof SubExpressionTypeClass;
};

