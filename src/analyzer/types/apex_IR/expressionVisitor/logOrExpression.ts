import { LogOrExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class LogOrExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    string,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('logOrExpression', left, right, '||');
    }

    static create(ctx: LogOrExpressionContext): LogOrExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 2 || !ctx.OR()) {
            throw new Error('値が異常です。LogOrExpressionContext: ' + ctx.getText());
        }

        return new LogOrExpressionTypeClass(
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

export const isLogOrExpressionType = (
    target: CommonTypeClass,
): target is LogOrExpressionTypeClass => {
    return target instanceof LogOrExpressionTypeClass;
};

