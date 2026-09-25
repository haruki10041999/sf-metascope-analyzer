import { CastExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

import { TypeField, makeTypeField } from '../type';

export type CastExpressionType = {
    type: 'castExpression';
    value: Omit<ExpressionType, 'type'>;
    targetType: Omit<TypeField, 'type'>;
};

export const makeCastExpressionType = (ctx: CastExpressionContext): CastExpressionType => {
    const { type: valueType, ...value } = new ExpressionVisitor().visit(ctx.expression());
    const { type: targetTypeType, ...targetType } = makeTypeField(ctx.typeRef());

    return {
        type: 'castExpression',
        value: value,
        targetType: targetType,
    };
};

