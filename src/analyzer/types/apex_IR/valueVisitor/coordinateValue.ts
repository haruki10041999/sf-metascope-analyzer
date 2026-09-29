import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { LiteralType, LiteralVisitor } from '../literalVisitor';

export type CoordinateValueType = {
    type: 'coordinateValue';
    value: ExpressionType | LiteralType;
};

export const makeCoordinateValueType = (ctx: CoordinateValueContext): CoordinateValueType => {
    if (ctx.signedNumber()) {
        const value = new LiteralVisitor().visit(ctx.signedNumber());
        return {
            type: 'coordinateValue',
            value: value,
        };
    }

    if (ctx.boundExpression()) {
        const value = new ExpressionVisitor().visit(ctx.boundExpression());
        return {
            type: 'coordinateValue',
            value: value,
        };
    }

    throw new Error('値が異常です。CoordinateValueContext: ' + ctx.getText());
};

