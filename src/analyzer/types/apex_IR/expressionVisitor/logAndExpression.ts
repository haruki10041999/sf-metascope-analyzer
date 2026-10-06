import { LogAndExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class LogAndExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    string,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
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
                isExpressionTypeAll,
                'expression',
            ),
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isLogAndExpressionType = (
    target: CommonTypeClass,
): target is LogAndExpressionTypeClass => {
    return target instanceof LogAndExpressionTypeClass;
};

