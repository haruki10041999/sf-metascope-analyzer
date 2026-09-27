import {
    ApexParserBaseVisitor,
    NoRestContext,
    ClassCreatorRestContext,
    ArrayCreatorRestContext,
    MapCreatorRestContext,
    SetCreatorRestContext,
} from '@apexdevtools/apex-parser';

import { NoRestType, makeNoRestType } from './noRest';
import { ClassCreatorRestType, makeClassCreatorRestType } from './classCreatorRest';
import { ArrayCreatorRestType, makeArrayCreatorRestType } from './arrayCreatorRest';
import { MapCreatorRestType, makeMapCreatorRestType } from './mapCreatorRest';
import { SetCreatorRestType, makeSetCreatorRestType } from './SetCreatorRest';

export type RestType =
    | NoRestType
    | ClassCreatorRestType
    | ArrayCreatorRestType
    | MapCreatorRestType
    | SetCreatorRestType;

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
}
