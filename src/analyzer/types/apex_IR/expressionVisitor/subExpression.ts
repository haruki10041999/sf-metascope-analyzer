import { SubExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionAllTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class SubExpressionTypeClass extends ExpressionTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass) {
        super('subExpression', value);
    }

    static create(ctx: SubExpressionContext): SubExpressionTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。SubExpressionContext: ' + ctx);
        }

        return new SubExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isSubExpressionType = (target: CommonTypeClass): target is SubExpressionTypeClass => {
    return target instanceof SubExpressionTypeClass;
};

