import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleStringOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class LogAndExpressionTypeClass extends DoubleStringOperatorExpressionTypeClass<
    'logAndExpression',
    BasedExpressionTypeClass,
    '&&',
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
    ) {
        super('logAndExpression', left, right, '&&');
    }

    static create(ctx: LogAndExpressionContext): LogAndExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.AND()) {
            throw new Error('値が異常です。LogAndExpressionContext: ' + ctx.getText());
        }

        return new LogAndExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionType,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isLogAndExpressionType = (
    target: CommonTypeClass<string>,
): target is LogAndExpressionTypeClass => {
    return target instanceof LogAndExpressionTypeClass;
};
