import { LogOrExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class LogOrExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'logOrExpression',
    BasedExpressionTypeClass,
    '||',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ApexErrorTypeClass,
        right: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('logOrExpression', left, right, '||');
    }

    static create(ctx: LogOrExpressionContext): LogOrExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.OR()) {
            throw new Error('値が異常です。LogOrExpressionContext: ' + ctx.getText());
        }

        return new LogOrExpressionTypeClass(
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

export const isLogOrExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is LogOrExpressionTypeClass => {
    return target instanceof LogOrExpressionTypeClass;
};
