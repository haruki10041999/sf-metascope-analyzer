import {
    SoqlFunctionContext,
    LocationValueContext,
    BoundExpressionContext,
    CoordinateValueContext,
} from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from '../field';

type BindValueType = {
    type: 'bind';
    variant: string;
};

type CoordinateValueType =
    | BindValueType
    | {
          type: 'literal';
          value: string;
      };

export type DistanceValueType = (
    | BindValueType
    | {
          type: 'coodinate';
          latitude: CoordinateValueType;
          longitude: CoordinateValueType;
      }
    | {
          type: 'field';
          field: SoqlField;
      }
) & {
    isGEOLOCATION: boolean;
};

export type DistanceFunctionType = {
    type: 'DISTANCE';
    from: DistanceValueType;
    to: DistanceValueType;
    unit: string;
};

export const isDistanceFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.DISTANCE() !== undefined;
};

export const makeDistanceFunctionType = (
    ctxs: LocationValueContext[],
    unit: string,
): DistanceFunctionType => {
    if (ctxs.length !== 2) {
        throw new Error(`数が異常です、LocationValueContext:${ctxs.length}`);
    }

    return {
        type: 'DISTANCE',
        from: makeDistanceValueType(ctxs[0]!),
        to: makeDistanceValueType(ctxs[1]!),
        unit: unit,
    };
};

const makeDistanceValueType = (ctx: LocationValueContext): DistanceValueType => {
    const isGEOLOCATION = ctx.GEOLOCATION() !== undefined;

    if (ctx.coordinateValue_list().length === 2) {
        const latitude = makeCoodinateValue(ctx.coordinateValue(0));
        const longitude = makeCoodinateValue(ctx.coordinateValue(1));
        return {
            type: 'coodinate',
            latitude: latitude,
            longitude: longitude,
            isGEOLOCATION: isGEOLOCATION,
        };
    }

    if (ctx.boundExpression()) {
        return {
            type: 'bind',
            variant: ctx.boundExpression().getText(),
            isGEOLOCATION: isGEOLOCATION,
        };
    }

    return {
        type: 'field',
        field: makeSoqlField(ctx.fieldName()),
        isGEOLOCATION: isGEOLOCATION,
    };
};

const makeCoodinateValue = (ctx: CoordinateValueContext): CoordinateValueType => {
    if (ctx.boundExpression()) {
        return {
            type: 'bind',
            variant: ctx.boundExpression().getText(),
        };
    }

    return {
        type: 'literal',
        value: ctx.signedNumber().getText(),
    };
};
