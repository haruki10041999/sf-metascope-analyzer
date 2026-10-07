import { ParExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionAllTypeClass,
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class ParExpressionTypeClass extends ExpressionTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass) {
        super('parExpression', value);
    }

    static create(ctx: ParExpressionContext): ParExpressionTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ParExpressionContext: ' + ctx.getText());
        }

        return new ParExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isParExpressionType = (target: CommonTypeClass): target is ParExpressionTypeClass => {
    return target instanceof ParExpressionTypeClass;
};
