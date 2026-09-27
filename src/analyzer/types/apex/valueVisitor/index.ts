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
    visitValue(ctx: ValueContext) {
        return makeValueType(ctx);
    }

    visitElementValue(ctx: ElementValueContext): ValueType {
        return makeElementValueType(ctx);
    }

    visitWhenValue(ctx: WhenValueContext): ValueType {
        return makeWhenValueType(ctx);
    }

    visitCoordinateValue(ctx: CoordinateValueContext) {
        return makeCoordinateValueType(ctx);
    }

    visitLocationValue(ctx: LocationValueContext) {
        return makeLocationValueType(ctx);
    }
}
