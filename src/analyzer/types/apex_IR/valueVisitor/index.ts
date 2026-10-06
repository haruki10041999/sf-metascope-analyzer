import {
    ValueContext,
    ElementValueContext,
    WhenValueContext,
    CoordinateValueContext,
    LocationValueContext,
} from '@apexdevtools/apex-parser';

import { NormalValueTypeClass } from './normal';
import { ElementValueTypeClass } from './elementValue';
import { WhenValueTypeClass } from './whenValue';
import { CoordinateValueTypeClass } from './coordinateValue';
import { LocationValueTypeClass } from './locationValue';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalValueType, NormalValueTypeClass } from './normal';
export { isElementValueType, ElementValueTypeClass } from './elementValue';
export { isWhenValueType, WhenValueTypeClass } from './whenValue';
export { isCoordinateValueType, CoordinateValueTypeClass } from './coordinateValue';
export { isLocationValueType, LocationValueTypeClass } from './locationValue';
export class ValueTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isValueTypeAll = (target: CommonTypeClass): target is ValueTypeClass<unknown> => {
    return target instanceof ValueTypeClass;
};

export class ValueVisitor extends CommonVisitor<ValueTypeClass<unknown>> {
    visitValue(ctx: ValueContext) {
        console.log('解析を開始します。' + 'ValueContext:  ' + ctx.getText());
        const result = makeValueType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ValueContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
