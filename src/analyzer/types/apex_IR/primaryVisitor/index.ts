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
import type { BasedPrimaryTypeClass } from './basedPrimary';
export type { BasedPrimaryTypeClass };

import { isNormalPrimaryType, NormalPrimaryTypeClass } from './normal';
import { isThisPrimaryType, ThisPrimaryTypeClass } from './thisPrimary';
import { isVoidPrimaryType, VoidPrimaryTypeClass } from './voidPrimary';
import { isSoqlPrimaryType, SoqlPrimaryTypeClass } from './soqlPrimary';
import { isSuperPrimaryType, SuperPrimaryTypeClass } from './superPrimary';
import { isTypeRefPrimaryType, TypeRefPrimaryTypeClass } from './typeRefPrimary';
import { isIdPrimaryType, IdPrimaryTypeClass } from './idPrimary';
import { isLiteralPrimaryType, LiteralPrimaryTypeClass } from './literalPrimary';
import { isSoslPrimaryType, SoslPrimaryTypeClass } from './soslPrimary';

import { CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalPrimaryType, NormalPrimaryTypeClass } from './normal';
export { isThisPrimaryType, ThisPrimaryTypeClass } from './thisPrimary';
export { isVoidPrimaryType, VoidPrimaryTypeClass } from './voidPrimary';
export { isSoqlPrimaryType, SoqlPrimaryTypeClass } from './soqlPrimary';
export { isSuperPrimaryType, SuperPrimaryTypeClass } from './superPrimary';
export { isIdPrimaryType, IdPrimaryTypeClass } from './idPrimary';
export { isLiteralPrimaryType, LiteralPrimaryTypeClass } from './literalPrimary';
export { isSoslPrimaryType, SoslPrimaryTypeClass } from './soslPrimary';
export { isTypeRefPrimaryType, TypeRefPrimaryTypeClass } from './typeRefPrimary';

export const isBasedPrimaryType = (
    target: CommonTypeClass<string>,
): target is BasedPrimaryTypeClass => {
    return (
        isNormalPrimaryType(target) ||
        isThisPrimaryType(target) ||
        isVoidPrimaryType(target) ||
        isSoqlPrimaryType(target) ||
        isSuperPrimaryType(target) ||
        isTypeRefPrimaryType(target) ||
        isIdPrimaryType(target) ||
        isLiteralPrimaryType(target) ||
        isSoslPrimaryType(target)
    );
};

export class PrimaryVisitor extends CommonVisitor<PrimaryTypeClass<string, unknown>> {
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
