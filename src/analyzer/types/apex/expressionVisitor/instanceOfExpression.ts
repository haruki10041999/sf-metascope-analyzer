import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type InstanceOfExpressionType = {
    type: 'instanceOfExpression';
    value: Omit<ExpressionType, 'type'>;
    targetType: Omit<TypeRefType, 'type'>;
};

export const makeInstanceOfExpressionType = (
    ctx: InstanceOfExpressionContext,
): InstanceOfExpressionType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());
    const { type: _, ...targetType } = makeTypeRefType(ctx.typeRef());

    return {
        type: 'instanceOfExpression',
        value: value,
        targetType: targetType,
    };
};
