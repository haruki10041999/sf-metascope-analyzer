import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

import { TypeField, makeTypeField } from '../type';

export type InstanceOfExpressionType = {
    type: 'instanceOfExpression';
    value: Omit<ExpressionType, 'type'>;
    targetType: TypeField;
};

export const makeInstanceOfExpressionType = (
    ctx: InstanceOfExpressionContext,
): InstanceOfExpressionType => {
    const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());
    const targetType = makeTypeField(ctx.typeRef());

    return {
        type: 'instanceOfExpression',
        value: value,
        targetType: targetType,
    };
};

