import { PostOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class PostOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass, operator: string) {
        super('postOpExpression', value, operator);
    }

    static create(ctx: PostOpExpressionContext): PostOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC())) {
            throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
        }

        return new PostOpExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
            ctx.INC() ? '++' : '--',
        );
    }
}

export const isPostOpExpressionType = (
    target: CommonTypeClass,
): target is PostOpExpressionTypeClass => {
    return target instanceof PostOpExpressionTypeClass;
};

