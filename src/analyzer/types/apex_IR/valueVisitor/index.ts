import {
    ValueContext,
    ElementValueContext,
    WhenValueContext,
    CoordinateValueContext,
    LocationValueContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ValueTypeClass } from './base';

import { NormalValueTypeClass } from './normal';
import { ElementValueTypeClass } from './elementValue';
import { WhenValueTypeClass } from './whenValue';
import { CoordinateValueTypeClass } from './coordinateValue';
import { LocationValueTypeClass } from './locationValue';

import { CommonVisitor } from '../commonVisitor';

export { isNormalValueType, NormalValueTypeClass } from './normal';
export { isElementValueType, ElementValueTypeClass } from './elementValue';
export { isWhenValueType, WhenValueTypeClass } from './whenValue';
export { isCoordinateValueType, CoordinateValueTypeClass } from './coordinateValue';
export { isLocationValueType, LocationValueTypeClass } from './locationValue';

export class ValueVisitor extends CommonVisitor<ValueTypeClass<unknown>> {
    visitValue(ctx: ValueContext) {
        return NormalValueTypeClass.create(ctx);
    }

    visitElementValue(ctx: ElementValueContext) {
        return ElementValueTypeClass.create(ctx);
    }

    visitWhenValue(ctx: WhenValueContext) {
        return WhenValueTypeClass.create(ctx);
    }

    visitCoordinateValue(ctx: CoordinateValueContext) {
        return CoordinateValueTypeClass.create(ctx);
    }

    visitLocationValue(ctx: LocationValueContext) {
        return LocationValueTypeClass.create(ctx);
    }
}
