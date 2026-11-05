import { PostOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class PostOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    'postOpExpression',
    BasedExpressionTypeClass,
    '++' | '--'
> {
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        operator: '++' | '--',
    ) {
        super('postOpExpression', value, operator);
    }

    static create(ctx: PostOpExpressionContext): PostOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC())) {
            throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
        }

        return new PostOpExpressionTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            ctx.INC() ? '++' : '--',
        );
    }
}

export const isPostOpExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is PostOpExpressionTypeClass => {
    return target instanceof PostOpExpressionTypeClass;
};
