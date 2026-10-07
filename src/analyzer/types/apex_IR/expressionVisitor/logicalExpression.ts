import { LogicalExpressionContext } from '@apexdevtools/apex-parser';

import {
    ConditionalExpressionTypeClass,
    ExpressionListBaseTypeClass,
    ExpressionVisitor,
    isConditionalExpressionType,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClassList } from '../commonVisitor';

export class LogicalExpressionTypeClass extends ExpressionListBaseTypeClass<ConditionalExpressionTypeClass> {
    private operator: string | null = null;

    private constructor(
        value: (ConditionalExpressionTypeClass | ErrorTypeClass)[],
        operator: string | null,
    ) {
        super('logicalExpression', value);
        this.operator = operator;
    }

    static create(ctx: LogicalExpressionContext): LogicalExpressionTypeClass {
        if (
            !ctx.conditionalExpression_list() ||
            ctx.conditionalExpression_list().length - 1 !==
                (ctx.SOQLAND_list()?.length ?? 0) + (ctx.SOQLOR_list()?.length ?? 0)
        ) {
            throw new Error('値が異常です。LogicalExpressionContext: ' + ctx.getText());
        }

        return new LogicalExpressionTypeClass(
            isValidClassList(
                ctx.conditionalExpression_list(),
                (ctx) => new ExpressionVisitor().visit(ctx),
                isConditionalExpressionType,
                'conditionalExpression',
            ),
            ctx.SOQLAND_list()?.length
                ? 'AND'
                : ctx.SOQLOR_list()?.length
                  ? 'OR'
                  : ctx.NOT()
                    ? 'NOT'
                    : null,
        );
    }

    getOperator(): string | null {
        return this.operator;
    }
}

export const isLogicalExpressionType = (
    target: CommonTypeClass,
): target is LogicalExpressionTypeClass => {
    return target instanceof LogicalExpressionTypeClass;
};

