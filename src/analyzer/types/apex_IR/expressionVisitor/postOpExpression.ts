import { PostOpExpressionContext } from '@apexdevtools/apex-parser';

import {
    ExpressionTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
    SingleOperatorExpressionTypeClass,
} from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class PostOpExpressionTypeClass extends SingleOperatorExpressionTypeClass {
    private constructor(
        literal: ExpressionTypeClass | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('postOpExpression', literal, operator, errorClasses);
    }

    static create(ctx: PostOpExpressionContext): PostOpExpressionTypeClass {
        if (!ctx.expression() || (!ctx.INC() && !ctx.DEC())) {
            throw new Error('値が異常です。PostOpExpressionContext: ' + ctx.getText());
        }

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());

        let literal: ExpressionTypeClass | null = null;
        let operator: string | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        if (isExpressionTypeAll(expressionTypeClass)) {
            literal = expressionTypeClass;
        } else {
            errorTypeClasses['literal'] = expressionTypeClass;
        }

        if (ctx.INC()) {
            operator = '++';
        }
        if (ctx.DEC()) {
            operator = '--';
        }

        return new PostOpExpressionTypeClass(literal, operator, errorTypeClasses);
    }
}

export const isPostOpExpressionType = (
    target: CommonTypeClass,
): target is PostOpExpressionTypeClass => {
    return target instanceof PostOpExpressionTypeClass;
};

