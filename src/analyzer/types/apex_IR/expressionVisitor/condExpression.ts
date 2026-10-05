import { CondExpressionContext } from '@apexdevtools/apex-parser';

import {
    ConditionExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CondExpressionTypeClass extends ConditionExpressionTypeClass<
    ExpressionAllTypeClass,
    ExpressionAllTypeClass,
    ExpressionAllTypeClass
> {
    constructor(
        condition: ExpressionAllTypeClass | ErrorTypeClass,
        trueValue: ExpressionAllTypeClass | ErrorTypeClass,
        falseValue: ExpressionAllTypeClass | ErrorTypeClass,
    ) {
        super('condExpression', condition, trueValue, falseValue);
    }

    static create(ctx: CondExpressionContext): CondExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 3) {
            throw new Error('Invalid CondExpressionContext: ' + ctx.getText());
        }

        return new CondExpressionTypeClass(
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
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression(2)),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isCondExpressionType = (
    target: CommonTypeClass,
): target is CondExpressionTypeClass => {
    return target instanceof CondExpressionTypeClass;
};
