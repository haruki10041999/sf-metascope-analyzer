import { InstanceOfExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '.';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type InstanceOfExpressionType = {
    type: 'instanceOfExpression';
    expression: {
        left: ExpressionType;
        operator: 'instanceof';
        right: TypeType;
    };
};

export const makeInstanceOfExpressionType = (
    ctx: InstanceOfExpressionContext,
): InstanceOfExpressionType => {
    if (!ctx.expression() || !ctx.typeRef()) {
        throw new Error('値が異常です。InstanceOfExpressionContext: ' + ctx.getText());
    }

    const value = new ExpressionVisitor().visit(ctx.expression());
    const targetType = new TypeVisitor().visit(ctx.typeRef());

    return {
        type: 'instanceOfExpression',
        expression: {
            left: value,
            operator: 'instanceof',
            right: targetType,
        },
    };
};

