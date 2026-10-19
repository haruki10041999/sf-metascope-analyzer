import { SubExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class SubExpressionTypeClass extends ExpressionTypeClass<BasedExpressionTypeClass> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass) {
        super('subExpression', value);
    }

    static create(ctx: SubExpressionContext): SubExpressionTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。SubExpressionContext: ' + ctx.getText());
        }

        return new SubExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isSubExpressionType = (target: CommonTypeClass): target is SubExpressionTypeClass => {
    return target instanceof SubExpressionTypeClass;
};
