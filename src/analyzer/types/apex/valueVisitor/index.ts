import {
    ApexParserBaseVisitor,
    ValueContext,
    ElementValueContext,
    WhenValueContext,
    CoordinateValueContext,
    LocationValueContext,
} from '@apexdevtools/apex-parser';

import { ValueType as valueType, makeValueType } from './value';
import { ElementValueType, makeElementValueType } from './elementValue';
import { WhenValueType, makeWhenValueType } from './whenValue';
import { CoodinateValueType, makeCoordinateValueType } from './coordinateValue';
import { LocationValueType, makeLocationValueType } from './locationValue';

export type ValueType =
    valueType | ElementValueType | WhenValueType | CoodinateValueType | LocationValueType;

export class ValueVisitor extends ApexParserBaseVisitor<ValueType> {
    visitValueContext(ctx: ValueContext) {
        return makeValueType(ctx);
    }

    visitElementValueContext(ctx: ElementValueContext): ValueType {
        return makeElementValueType(ctx);
    }

    visitWhenValueContext(ctx: WhenValueContext): ValueType {
        return makeWhenValueType(ctx);
    }

    visitCoordinateValueContext(ctx: CoordinateValueContext) {
        return makeCoordinateValueType(ctx);
    }

    visitLocationValueContext(ctx: LocationValueContext) {
        return makeLocationValueType(ctx);
    }
}
