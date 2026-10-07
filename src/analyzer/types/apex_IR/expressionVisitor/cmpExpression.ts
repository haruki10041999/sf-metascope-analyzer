import { CmpExpressionContext } from '@apexdevtools/apex-parser';

import {
    DoubleOperatorExpressionTypeClass,
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CmpExpressionTypeClass extends DoubleOperatorExpressionTypeClass<
    ExpressionAllTypeClass,
    string,
    ExpressionAllTypeClass
> {
    private constructor(
        left: ExpressionAllTypeClass | ErrorTypeClass,
        right: ExpressionAllTypeClass | ErrorTypeClass,
        operator: string,
    ) {
        super('cmpExpression', left, right, operator);
    }

    static create(ctx: CmpExpressionContext): CmpExpressionTypeClass {
        if (ctx.expression_list().length !== 2 || (!ctx.GT() && !ctx.LT())) {
            throw new Error('値が異常です。CmpExpressionContext: ' + ctx.getText());
        }

        return new CmpExpressionTypeClass(
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
            // `<=` / `>=` は LT/GT と ASSIGN の 2 トークンで表現される
            (ctx.GT() ? '>' : '<') + (ctx.ASSIGN() ? '=' : ''),
        );
    }
}

export const isCmpExpressionType = (target: CommonTypeClass): target is CmpExpressionTypeClass => {
    return target instanceof CmpExpressionTypeClass;
};

