import { LocationValueContext } from '@apexdevtools/apex-parser';

import { ValueType, ValueVisitor } from '.';

import { NameType, NameVisitor } from '../nameVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type LocationValueType = {
    type: 'locationValue';
    value: Omit<NameType, 'type'> | Omit<ExpressionType, 'type'> | Omit<ValueType, 'type'>[];
    isGeoLocation?: boolean;
};

export const makeLocationValueType = (ctx: LocationValueContext): LocationValueType => {
    if (ctx.fieldName()) {
        const { type, ...value } = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'locationValue',
            value: value,
        };
    }

    if (ctx.boundExpression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.boundExpression());
        return {
            type: 'locationValue',
            value: value,
        };
    }

    if (ctx.coordinateValue_list() && ctx.coordinateValue_list().length !== 2) {
        const values = ctx.coordinateValue_list().map((coordinateValueCtx) => {
            const { type, ...value } = new ValueVisitor().visit(coordinateValueCtx);
            return value;
        });

        const isGeoLocation = ctx.GEOLOCATION() !== undefined;

        return {
            type: 'locationValue',
            value: values,
            isGeoLocation: isGeoLocation,
        };
    }

    throw new Error('値が異常です。LocationValueContext: ' + ctx.getText());
};
