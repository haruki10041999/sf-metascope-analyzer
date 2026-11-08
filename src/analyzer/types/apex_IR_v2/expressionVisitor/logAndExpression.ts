import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class LogAndExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'logAndExpression',
    BasedExpressionTypeClass,
    '&&',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('logAndExpression', left, right, '&&');
    }

    static create(ctx: LogAndExpressionContext): LogAndExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.AND()) {
            throw new Error('値が異常です。LogAndExpressionContext: ' + ctx.getText());
        }

        return new LogAndExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(0),
                isBasedExpressionType,
                'expression',
            ),
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(1),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isLogAndExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is LogAndExpressionTypeClass => {
    return target instanceof LogAndExpressionTypeClass;
};
