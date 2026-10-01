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

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNoRestType, NoRestTypeClass } from './noRest';
export { isClassCreatorRestType, ClassCreatorRestTypeClass } from './classCreatorRest';
export { isArrayCreatorRestType, ArrayCreatorRestTypeClass } from './arrayCreatorRest';
export { isMapCreatorRestType, MapCreatorRestTypeClass } from './mapCreatorRest';
export { isSetCreatorRestType, SetCreatorRestTypeClass } from './SetCreatorRest';
export { isCreatorType, CreatorTypeClass } from './creator';

export class RestTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isRestTypeAll = (target: CommonTypeClass): target is RestTypeClass<unknown> => {
    return target instanceof RestTypeClass;
};

export class RestVisitor extends CommonVisitor<RestTypeClass<unknown>> {
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

