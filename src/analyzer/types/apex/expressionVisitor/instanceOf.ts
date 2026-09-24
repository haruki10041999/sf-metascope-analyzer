import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';

import { TypeField, makeTypeField } from '../type';

export type InstanceOfExpressionType = {
    type: 'instanceOf';
    value: ExpressionType;
    targetType: TypeField;
};

export const makeInstanceOfExpressionType = (
    ctx: InstanceOfExpressionContext,
): InstanceOfExpressionType => {
    const value = new ExpressionVisitor().visit(ctx.expression());
    const targetType = makeTypeField(ctx.typeRef());

    return {
        type: 'instanceOf',
        value: value,
        targetType: targetType,
    };
};
