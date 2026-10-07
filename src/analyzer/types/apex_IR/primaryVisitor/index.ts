import {
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

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { PrimaryTypeClass } from './base';

import { NormalPrimaryTypeClass } from './normal';
import { ThisPrimaryTypeClass } from './thisPrimary';
import { VoidPrimaryTypeClass } from './voidPrimary';
import { SoqlPrimaryTypeClass } from './soqlPrimary';
import { SuperPrimaryTypeClass } from './superPrimary';
import { TypeRefPrimaryTypeClass } from './typeRefPrimary';
import { IdPrimaryTypeClass } from './idPrimary';
import { LiteralPrimaryTypeClass } from './literalPrimary';
import { SoslPrimaryTypeClass } from './soslPrimary';

import { CommonVisitor } from '../commonVisitor';

export { isNormalPrimaryType, NormalPrimaryTypeClass } from './normal';
export { isThisPrimaryType, ThisPrimaryTypeClass } from './thisPrimary';
export { isVoidPrimaryType, VoidPrimaryTypeClass } from './voidPrimary';
export { isSoqlPrimaryType, SoqlPrimaryTypeClass } from './soqlPrimary';
export { isSuperPrimaryType, SuperPrimaryTypeClass } from './superPrimary';
export { isIdPrimaryType, IdPrimaryTypeClass } from './idPrimary';
export { isLiteralPrimaryType, LiteralPrimaryTypeClass } from './literalPrimary';
export { isSoslPrimaryType, SoslPrimaryTypeClass } from './soslPrimary';
export { isTypeRefPrimaryType, TypeRefPrimaryTypeClass } from './typeRefPrimary';

export class PrimaryVisitor extends CommonVisitor<PrimaryTypeClass<unknown>> {
    visitPrimary(ctx: PrimaryContext) {
        return NormalPrimaryTypeClass.create(ctx);
    }

    visitThisPrimary(ctx: ThisPrimaryContext) {
        return ThisPrimaryTypeClass.create(ctx);
    }

    visitVoidPrimary(ctx: VoidPrimaryContext) {
        return VoidPrimaryTypeClass.create(ctx);
    }

    visitSoqlPrimary(ctx: SoqlPrimaryContext) {
        return SoqlPrimaryTypeClass.create(ctx);
    }

    visitSuperPrimary(ctx: SuperPrimaryContext) {
        return SuperPrimaryTypeClass.create(ctx);
    }

    visitTypeRefPrimary(ctx: TypeRefPrimaryContext) {
        return TypeRefPrimaryTypeClass.create(ctx);
    }

    visitIdPrimary(ctx: IdPrimaryContext) {
        return IdPrimaryTypeClass.create(ctx);
    }

    visitLiteralPrimary(ctx: LiteralPrimaryContext) {
        return LiteralPrimaryTypeClass.create(ctx);
    }

    visitSoslPrimary(ctx: SoslPrimaryContext) {
        return SoslPrimaryTypeClass.create(ctx);
    }
}

