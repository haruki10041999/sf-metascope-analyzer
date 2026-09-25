import {
    ApexParserBaseVisitor,
    ElementValueContext,
    WhenValueContext,
} from '@apexdevtools/apex-parser';

import { ElementValueType, makeElementValueType } from './elementValue';
import { WhenValueType, makeWhenValueType } from './whenValue';

export type ValueType = ElementValueType | WhenValueType;

export class ValueVisitor extends ApexParserBaseVisitor<ValueType> {
    visitElementValueContext(ctx: ElementValueContext): ValueType {
        return makeElementValueType(ctx);
    }

    visitWhenValueContext(ctx: WhenValueContext): ValueType {
        return makeWhenValueType(ctx);
    }
}
