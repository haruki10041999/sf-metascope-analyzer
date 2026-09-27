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
    SoslPrimaryContext,
} from '@apexdevtools/apex-parser';

import { PrimaryType as primaryType, makePrimaryType } from './primary';
import { ThisPrimaryType, makeThisPrimaryType } from './thisPrimary';
import { VoidPrimaryType, makeVoidPrimaryType } from './voidPrimary';
import { SoqlPrimaryType, makeSoqlPrimaryType } from './soqlPrimary';
import { SuperPrimaryType, makeSuperPrimaryType } from './superPrimary';
import { TypeRefPrimaryType, makeTypeRefPrimaryType } from './typeRefPrimary';
import { IdPrimaryType, makeIdPrimaryType } from './idPrimary';
import { LiteralPrimaryType, makeLiteralPrimaryType } from './literalPrimary';
import { SoslPrimaryType, makeSoslPrimaryType } from './soslPrimary';

export type PrimaryType =
    | primaryType
    | ThisPrimaryType
    | VoidPrimaryType
    | SoqlPrimaryType
    | SuperPrimaryType
    | TypeRefPrimaryType
    | IdPrimaryType
    | LiteralPrimaryType
    | SoslPrimaryType;

export class PrimaryVisitor extends ApexParserBaseVisitor<PrimaryType> {
    visitPrimary(ctx: PrimaryContext) {
        return makePrimaryType(ctx);
    }

    visitThisPrimary(ctx: ThisPrimaryContext) {
        return makeThisPrimaryType(ctx);
    }

    visitVoidPrimary(ctx: VoidPrimaryContext) {
        return makeVoidPrimaryType(ctx);
    }

    visitSoqlPrimary(ctx: SoqlPrimaryContext) {
        return makeSoqlPrimaryType(ctx);
    }

    visitSuperPrimary(ctx: SuperPrimaryContext) {
        return makeSuperPrimaryType(ctx);
    }

    visitTypeRefPrimary(ctx: TypeRefPrimaryContext) {
        return makeTypeRefPrimaryType(ctx);
    }

    visitIdPrimary(ctx: IdPrimaryContext) {
        return makeIdPrimaryType(ctx);
    }

    visitLiteralPrimary(ctx: LiteralPrimaryContext) {
        return makeLiteralPrimaryType(ctx);
    }

    visitSoslPrimary(ctx: SoslPrimaryContext) {
        return makeSoslPrimaryType(ctx);
    }
}
