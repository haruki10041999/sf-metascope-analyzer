import { CastExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type CastExpressionType = {
    type: 'castExpression';
    value: Omit<ExpressionType, 'type'>;
    targetType: Omit<TypeRefType, 'type'>;
};

export const makeCastExpressionType = (ctx: CastExpressionContext): CastExpressionType => {
    const { type: valueType, ...value } = new ExpressionVisitor().visit(ctx.expression());
    const { type: targetTypeType, ...targetType } = makeTypeRefType(ctx.typeRef());

    return {
        type: 'castExpression',
        value: value,
        targetType: targetType,
    };
};
