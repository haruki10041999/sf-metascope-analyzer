import { PostOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class PostOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    'postOpExpression',
    BasedExpressionTypeClass,
    '++' | '--'
> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass, operator: '++' | '--') {
        super('postOpExpression', value, operator);
    }

    static create(ctx: PostOpExpressionContext): PostOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC())) {
            throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
        }

        return new PostOpExpressionTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
            ctx.INC() ? '++' : '--',
        );
    }
}

export const isPostOpExpressionType = (
    target: CommonTypeClass<string>,
): target is PostOpExpressionTypeClass => {
    return target instanceof PostOpExpressionTypeClass;
};
