import { CondExpressionContext } from '@apexdevtools/apex-parser';

import {
    ConditionExpressionTypeClass,
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class CondExpressionTypeClass extends ConditionExpressionTypeClass<
    'condExpression',
    BasedExpressionTypeClass,
    BasedExpressionTypeClass,
    BasedExpressionTypeClass
> {
    private constructor(
        condition: BasedExpressionTypeClass | ApexErrorTypeClass,
        trueValue: BasedExpressionTypeClass | ApexErrorTypeClass,
        falseValue: BasedExpressionTypeClass | ApexErrorTypeClass,
    ) {
        super('condExpression', condition, trueValue, falseValue);
    }

    static create(ctx: CondExpressionContext): CondExpressionTypeClass {
        if (!ctx.expression_list() || ctx.expression_list().length !== 3) {
            throw new Error('Invalid CondExpressionContext: ' + ctx.getText());
        }

        return new CondExpressionTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression(0)),
                isBasedExpressionType,
                'expression',
            ),
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression(1)),
                isBasedExpressionType,
                'expression',
            ),
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression(2)),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isCondExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is CondExpressionTypeClass => {
    return target instanceof CondExpressionTypeClass;
};

