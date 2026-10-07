import {
    ApexParserBaseVisitor,
    NoRestContext,
    ClassCreatorRestContext,
    ArrayCreatorRestContext,
    MapCreatorRestContext,
    SetCreatorRestContext,
    CreatorContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { RestAllTypeClass } from './base';

import { NoRestTypeClass } from './noRest';
import { ClassCreatorRestTypeClass } from './classCreatorRest';
import { ArrayCreatorRestTypeClass } from './arrayCreatorRest';
import { MapCreatorRestTypeClass } from './mapCreatorRest';
import { SetCreatorRestTypeClass } from './setCreatorRest';
import { CreatorTypeClass } from './creator';

import { CommonVisitor } from '../commonVisitor';

export { isNoRestType, NoRestTypeClass } from './noRest';
export { isClassCreatorRestType, ClassCreatorRestTypeClass } from './classCreatorRest';
export { isArrayCreatorRestType, ArrayCreatorRestTypeClass } from './arrayCreatorRest';
export { isMapCreatorRestType, MapCreatorRestTypeClass } from './mapCreatorRest';
export { isSetCreatorRestType, SetCreatorRestTypeClass } from './setCreatorRest';
export { isCreatorType, CreatorTypeClass } from './creator';

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

