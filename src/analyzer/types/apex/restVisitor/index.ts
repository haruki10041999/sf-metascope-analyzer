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
    visitNoRestContext(ctx: NoRestContext) {
        return makeNoRestType(ctx);
    }

    visitClassCreatorRestContext(ctx: ClassCreatorRestContext) {
        return makeClassCreatorRestType(ctx);
    }

    visitArrayCreatorRestContext(ctx: ArrayCreatorRestContext) {
        return makeArrayCreatorRestType(ctx);
    }

    visitMapCreatorRestContext(ctx: MapCreatorRestContext) {
        return makeMapCreatorRestType(ctx);
    }

    visitSetCreatorRestContext(ctx: SetCreatorRestContext) {
        return makeSetCreatorRestType(ctx);
    }
}
