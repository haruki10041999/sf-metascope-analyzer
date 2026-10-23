import { LogOrExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class LogOrExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    'logOrExpression',
    BasedExpressionTypeClass,
    string,
    BasedExpressionTypeClass
> {
    private constructor(
        left: BasedExpressionTypeClass | ErrorTypeClass,
        right: BasedExpressionTypeClass | ErrorTypeClass,
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

export const isLogOrExpressionType = (
    target: CommonTypeClass<string>,
): target is LogOrExpressionTypeClass => {
    return target instanceof LogOrExpressionTypeClass;
};
