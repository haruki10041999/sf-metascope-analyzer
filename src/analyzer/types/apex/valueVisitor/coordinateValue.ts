import { CoordinateValueContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { SignedNumberType, makeSignedNumberType } from '../signedNumber';

export type CoodinateValueType = {
    type: 'coordinateValue';
    value: Omit<ExpressionType, 'type'> | Omit<SignedNumberType, 'type'>;
};

export const makeCoordinateValueType = (ctx: CoordinateValueContext): CoodinateValueType => {
    if (ctx.signedNumber()) {
        const { type, ...value } = makeSignedNumberType(ctx.signedNumber());
        return {
            type: 'coordinateValue',
            value: value,
        };
    }

    if (ctx.boundExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.boundExpression());
        return {
            type: 'coordinateValue',
            value: value,
        };
    }

    throw new Error('値が異常です。CoordinateValueContext: ' + ctx.getText());
};
