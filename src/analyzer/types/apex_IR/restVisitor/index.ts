import {
    ApexParserBaseVisitor,
    NoRestContext,
    ClassCreatorRestContext,
    ArrayCreatorRestContext,
    MapCreatorRestContext,
    SetCreatorRestContext,
    CreatorContext,
} from '@apexdevtools/apex-parser';

import { NoRestTypeClass } from './noRest';
import { ClassCreatorRestTypeClass } from './classCreatorRest';
import { ArrayCreatorRestTypeClass } from './arrayCreatorRest';
import { MapCreatorRestTypeClass } from './mapCreatorRest';
import { SetCreatorRestTypeClass } from './SetCreatorRest';
import { CreatorTypeClass } from './creator';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNoRestType, NoRestTypeClass } from './noRest';
export { isClassCreatorRestType, ClassCreatorRestTypeClass } from './classCreatorRest';
export { isArrayCreatorRestType, ArrayCreatorRestTypeClass } from './arrayCreatorRest';
export { isMapCreatorRestType, MapCreatorRestTypeClass } from './mapCreatorRest';
export { isSetCreatorRestType, SetCreatorRestTypeClass } from './SetCreatorRest';
export { isCreatorType, CreatorTypeClass } from './creator';

export class RestTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class RestListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type RestAllTypeClass = RestTypeClass<unknown> | RestListTypeClass<unknown>;

export const isRestTypeAll = (target: CommonTypeClass): target is RestAllTypeClass => {
    return target instanceof RestTypeClass || target instanceof RestListTypeClass;
};

export class RestVisitor extends CommonVisitor<RestAllTypeClass> {
    visitNoRest(ctx: NoRestContext) {
        return NoRestTypeClass.create(ctx);
    }

    visitClassCreatorRest(ctx: ClassCreatorRestContext) {
        return ClassCreatorRestTypeClass.create(ctx);
    }

    visitArrayCreatorRest(ctx: ArrayCreatorRestContext) {
        return ArrayCreatorRestTypeClass.create(ctx);
    }

    visitMapCreatorRest(ctx: MapCreatorRestContext) {
        return MapCreatorRestTypeClass.create(ctx);
    }

    visitSetCreatorRest(ctx: SetCreatorRestContext) {
        return SetCreatorRestTypeClass.create(ctx);
    }

    visitCreator(ctx: CreatorContext) {
        return CreatorTypeClass.create(ctx);
    }
}

