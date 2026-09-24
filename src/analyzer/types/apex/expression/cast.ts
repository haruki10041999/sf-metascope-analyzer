import { CastExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

import { TypeField, makeTypeField } from '../type';

export type CastExpressionType = {
    type: 'cast';
    value: ExpressionField;
    targetType: TypeField;
};

export const makeCastExpressionType = (ctx: CastExpressionContext): CastExpressionType => {
    const visitor = new ExpressionVisitor();
    const value = visitor.visit(ctx.expression());
    const targetType = makeTypeField(ctx.typeRef());

    return {
        type: 'cast',
        value: value,
        targetType: targetType,
    };
};
