import {
    ApexParserBaseVisitor,
    PrimaryContext,
    ThisPrimaryContext,
    VoidPrimaryContext,
    SoqlPrimaryContext,
    SuperPrimaryContext,
    TypeRefPrimaryContext,
    IdPrimaryContext,
    LiteralPrimaryContext,
} from '@apexdevtools/apex-parser';

import { NormalPrimaryType, makeNormalPrimaryType } from './normal';
import { ThisPrimaryType, makeThisPrimaryType } from './this';
import { VoidPrimaryType, makeVoidPrimaryType } from './void';
import { SoqlPrimaryType, makeSoqlPrimaryType } from './soql';
import { SuperPrimaryType, makeSuperPrimaryType } from './super';
import { TypePrimaryType, makeTypePrimaryType } from './type';
import { IdPrimaryType, makeIdPrimaryType } from './id';
import { LiteralPrimaryType, makeLiteralPrimaryType } from './literal';

export type PrimaryType =
    | NormalPrimaryType
    | ThisPrimaryType
    | VoidPrimaryType
    | SoqlPrimaryType
    | SuperPrimaryType
    | TypePrimaryType
    | IdPrimaryType
    | LiteralPrimaryType;

export class PrimaryVisitor extends ApexParserBaseVisitor<PrimaryType> {
    visitPrimaryContext(ctx: PrimaryContext) {
        return makeNormalPrimaryType(ctx);
    }

    visitThisPrimaryContext(ctx: ThisPrimaryContext) {
        return makeThisPrimaryType(ctx);
    }

    visitVoidPrimaryContext(ctx: VoidPrimaryContext) {
        return makeVoidPrimaryType(ctx);
    }

    visitSoqlPrimaryContext(ctx: SoqlPrimaryContext) {
        return makeSoqlPrimaryType(ctx);
    }

    visitSuperPrimaryContext(ctx: SuperPrimaryContext) {
        return makeSuperPrimaryType(ctx);
    }

    visitTypeRefPrimaryContext(ctx: TypeRefPrimaryContext) {
        return makeTypePrimaryType(ctx);
    }

    visitIdPrimaryContext(ctx: IdPrimaryContext) {
        return makeIdPrimaryType(ctx);
    }

    visitLiteralPrimaryContext(ctx: LiteralPrimaryContext) {
        return makeLiteralPrimaryType(ctx);
    }
}
