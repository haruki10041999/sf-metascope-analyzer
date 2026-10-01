import { ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class ConditionalExpressionTypeClass extends ExpressionTypeClass<
    ExpressionTypeClass<unknown>
> {
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('conditionalExpression', value, errorClasses);
    }

    static create(ctx: ConditionalExpressionContext): ConditionalExpressionTypeClass {
        if (!ctx.logicalExpression() && !ctx.fieldExpression()) {
            throw new Error('値が異常です。ConditionalExpressionContext: ' + ctx);
        }

        let expressionTypeClass: ExpressionTypeClass<unknown> | ErrorTypeClass | null = null;
        if (ctx.logicalExpression()) {
            expressionTypeClass = new ExpressionVisitor().visit(ctx.logicalExpression());
        }

        if (ctx.fieldExpression()) {
            expressionTypeClass = new ExpressionVisitor().visit(ctx.fieldExpression());
        }

        let value: ExpressionTypeClass<unknown> | null = null;
        let errorTypeClasses: Record<string, ErrorTypeClass> = {};
        if (expressionTypeClass) {
            if (isExpressionTypeAll(expressionTypeClass)) {
                value = expressionTypeClass;
            } else {
                errorTypeClasses['value'] = expressionTypeClass;
            }
        }

        return new ConditionalExpressionTypeClass(value, errorTypeClasses);
    }
}

export const isConditionalExpressionType = (
    target: CommonTypeClass,
): target is ConditionalExpressionTypeClass => {
    return target instanceof ConditionalExpressionTypeClass;
};

