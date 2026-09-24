import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionField, ExpressionVisitor } from '.';

import { TypeField, makeTypeField } from '../type';

export type InstanceOfExpressionType = {
    type: 'instanceOf';
    value: ExpressionField;
    targetType: TypeField;
};

export const makeInstanceOfExpressionType = (
    ctx: InstanceOfExpressionContext,
): InstanceOfExpressionType => {
    const visitor = new ExpressionVisitor();
    const value = visitor.visit(ctx.expression());
    const targetType = makeTypeField(ctx.typeRef());

    return {
        type: 'instanceOf',
        value: value,
        targetType: targetType,
    };
};
