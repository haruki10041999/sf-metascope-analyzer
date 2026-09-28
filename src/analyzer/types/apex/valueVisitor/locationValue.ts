import { LocationValueContext } from '@apexdevtools/apex-parser';

import { ValueType, ValueVisitor } from '.';

import { NameType, NameVisitor } from '../nameVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type LocationValueType = {
    type: 'locationValue';
    value:
        | {
              value: NameType | ExpressionType;
          }
        | {
              value: ValueType[];
              isGeoLocation: boolean;
          };
};

export const makeLocationValueType = (ctx: LocationValueContext): LocationValueType => {
    if (ctx.fieldName()) {
        const value = new NameVisitor().visit(ctx.fieldName());
        return {
            type: 'locationValue',
            value: {
                value: value,
            },
        };
    }

    if (ctx.boundExpression()) {
        const value = new ExpressionVisitor().visit(ctx.boundExpression());
        return {
            type: 'locationValue',
            value: {
                value: value,
            },
        };
    }

    if (ctx.coordinateValue_list() && ctx.coordinateValue_list().length !== 2) {
        const values = ctx.coordinateValue_list().map((coordinateValueCtx) => {
            const value = new ValueVisitor().visit(coordinateValueCtx);
            return value;
        });

        return {
            type: 'locationValue',
            value: {
                value: values,
                isGeoLocation: Boolean(ctx.GEOLOCATION()),
            },
        };
    }

    throw new Error('値が異常です。LocationValueContext: ' + ctx.getText());
};
