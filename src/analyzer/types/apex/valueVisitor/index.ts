import {
    ApexParserBaseVisitor,
    ElementValueContext,
    WhenValueContext,
    CoordinateValueContext,
    LocationValueContext,
} from '@apexdevtools/apex-parser';

import { ElementValueType, makeElementValueType } from './elementValue';
import { WhenValueType, makeWhenValueType } from './whenValue';
import { CoodinateValueType, makeCoordinateValueType } from './coordinateValue';
import { LocationValueType, makeLocationValueType } from './locationValue';

export type ValueType = ElementValueType | WhenValueType | CoodinateValueType | LocationValueType;

export class ValueVisitor extends ApexParserBaseVisitor<ValueType> {
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
