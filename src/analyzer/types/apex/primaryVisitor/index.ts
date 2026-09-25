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

import { PrimaryType as primaryType, makePrimaryType } from './primary';
import { ThisPrimaryType, makeThisPrimaryType } from './thisPrimary';
import { VoidPrimaryType, makeVoidPrimaryType } from './voidPrimary';
import { SoqlPrimaryType, makeSoqlPrimaryType } from './soqlPrimary';
import { SuperPrimaryType, makeSuperPrimaryType } from './superPrimary';
import { TypeRefPrimaryType, makeTypeRefPrimaryType } from './typeRefPrimary';
import { IdPrimaryType, makeIdPrimaryType } from './idPrimary';
import { LiteralPrimaryType, makeLiteralPrimaryType } from './literalPrimary';

export type PrimaryType =
    | primaryType
    | ThisPrimaryType
    | VoidPrimaryType
    | SoqlPrimaryType
    | SuperPrimaryType
    | TypeRefPrimaryType
    | IdPrimaryType
    | LiteralPrimaryType;

export class PrimaryVisitor extends ApexParserBaseVisitor<PrimaryType> {
    visitPrimaryContext(ctx: PrimaryContext) {
        return makePrimaryType(ctx);
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
        return makeTypeRefPrimaryType(ctx);
    }

    visitIdPrimaryContext(ctx: IdPrimaryContext) {
        return makeIdPrimaryType(ctx);
    }

    visitLiteralPrimaryContext(ctx: LiteralPrimaryContext) {
        return makeLiteralPrimaryType(ctx);
    }
}

