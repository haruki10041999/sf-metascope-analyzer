import { ConditionalExpressionContext } from '@apexdevtools/apex-parser';

import {
    LogicalExpressionTypeClass,
    FieldExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isLogicalExpressionType,
    isFieldExpressionType,
} from '.';

import { ApexCommonTypeClass, ApexErrorTypeClass, isApexValidClass } from '../commonVisitor';

export class ConditionalExpressionTypeClass extends ExpressionTypeClass<
    'conditionalExpression',
    LogicalExpressionTypeClass | FieldExpressionTypeClass
> {
    private constructor(
        value: LogicalExpressionTypeClass | FieldExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('conditionalExpression', value);
    }

    static create(ctx: ConditionalExpressionContext): ConditionalExpressionTypeClass {
        if (!ctx.logicalExpression() && !ctx.fieldExpression()) {
            throw new Error('値が異常です。ConditionalExpressionContext: ' + ctx.getText());
        }

        return new ConditionalExpressionTypeClass(
            ctx.logicalExpression()
                ? isApexValidClass(
                      new ExpressionVisitor().visit(ctx.logicalExpression()),
                      isLogicalExpressionType,
                      'logicalExpression',
                  )
                : isApexValidClass(
                      new ExpressionVisitor().visit(ctx.fieldExpression()),
                      isFieldExpressionType,
                      'fieldExpression',
                  ),
        );
    }
}

export const isConditionalExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is ConditionalExpressionTypeClass => {
    return target instanceof ConditionalExpressionTypeClass;
};

