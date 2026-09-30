import { PostOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PostOpExpressionTypeClass extends SingleOperatorExpressionTypeClass<
    ExpressionTypeClass<unknown>
> {
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('postOpExpression', value, operator, errorClasses);
    }

    static create(ctx: PostOpExpressionContext): PostOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC())) {
            throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let value: ExpressionTypeClass<unknown> | null = null;
        let operator: string | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else {
            errorTypeClasses['literal'] = expressionTypeClass;
        }

        if (ctx.INC()) {
            operator = '++';
        }
        if (ctx.DEC()) {
            operator = '--';
        }

        return new PostOpExpressionTypeClass(value, operator, errorTypeClasses);
    }
}

export const isPostOpExpressionType = (
    target: CommonTypeClass,
): target is PostOpExpressionTypeClass => {
    return target instanceof PostOpExpressionTypeClass;
};
