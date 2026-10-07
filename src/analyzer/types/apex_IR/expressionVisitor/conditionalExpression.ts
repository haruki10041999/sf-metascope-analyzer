import { ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import {
    LogicalExpressionTypeClass,
    FieldExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isLogicalExpressionType,
    isFieldExpressionType,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class ConditionalExpressionTypeClass extends ExpressionTypeClass<
    LogicalExpressionTypeClass | FieldExpressionTypeClass
> {
    private constructor(
        value: LogicalExpressionTypeClass | FieldExpressionTypeClass | ErrorTypeClass,
    ) {
        super('conditionalExpression', value);
    }

    static create(ctx: ConditionalExpressionContext): ConditionalExpressionTypeClass {
        if (!ctx.logicalExpression() && !ctx.fieldExpression()) {
            throw new Error('値が異常です。ConditionalExpressionContext: ' + ctx.getText());
        }

        return new ConditionalExpressionTypeClass(
            ctx.logicalExpression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.logicalExpression()),
                      isLogicalExpressionType,
                      'logicalExpression',
                  )
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.fieldExpression()),
                      isFieldExpressionType,
                      'fieldExpression',
                  ),
        );
    }
}

export const isConditionalExpressionType = (
    target: CommonTypeClass,
): target is ConditionalExpressionTypeClass => {
    return target instanceof ConditionalExpressionTypeClass;
};

