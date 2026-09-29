import { CastExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type CastExpressionType = {
    type: 'castExpression';
    expression: {
        type: TypeType;
        value: ExpressionType;
    };
};

export const makeCastExpressionType = (ctx: CastExpressionContext): CastExpressionType => {
    if (!ctx.expression() || !ctx.typeRef()) {
        throw new Error('値が異常です。CastExpressionContext: ' + ctx.getText());
    }

    const value = new ExpressionVisitor().visit(ctx.expression());
    const targetType = new TypeVisitor().visit(ctx.typeRef());

    return {
        type: 'castExpression',
        expression: {
            type: targetType,
            value: value,
        },
    };
};

