import {
    ApexParserBaseVisitor,
    NoRestContext,
    ClassCreatorRestContext,
    ArrayCreatorRestContext,
    MapCreatorRestContext,
    SetCreatorRestContext,
    CreatorContext,
} from '@apexdevtools/apex-parser';

import { NoRestType, makeNoRestType } from './noRest';
import { ClassCreatorRestType, makeClassCreatorRestType } from './classCreatorRest';
import { ArrayCreatorRestType, makeArrayCreatorRestType } from './arrayCreatorRest';
import { MapCreatorRestType, makeMapCreatorRestType } from './mapCreatorRest';
import { SetCreatorRestType, makeSetCreatorRestType } from './SetCreatorRest';
import { CreatorType, makeCreatorType } from './creator';

export type RestType =
    | NoRestType
    | ClassCreatorRestType
    | ArrayCreatorRestType
    | MapCreatorRestType
    | SetCreatorRestType
    | CreatorType;

export class RestVisitor extends ApexParserBaseVisitor<RestType> {
    visitNoRest(ctx: NoRestContext) {
        return makeNoRestType(ctx);
    }

    visitClassCreatorRest(ctx: ClassCreatorRestContext) {
        return makeClassCreatorRestType(ctx);
    }

    visitArrayCreatorRest(ctx: ArrayCreatorRestContext) {
        return makeArrayCreatorRestType(ctx);
    }

    visitMapCreatorRest(ctx: MapCreatorRestContext) {
        return makeMapCreatorRestType(ctx);
    }

    visitSetCreatorRest(ctx: SetCreatorRestContext) {
        return makeSetCreatorRestType(ctx);
    }

    visitCreator(ctx: CreatorContext) {
        return makeCreatorType(ctx);
    }
}

