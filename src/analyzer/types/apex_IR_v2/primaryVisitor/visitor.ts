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

import { ApexCommonTypeClass, ApexCommonVisitor } from '../commonVisitor';
import { TypeField } from '../../commons/ir';

import { PrimaryTypeClass, isPrimaryType, type PrimaryType } from './primary';
import { ThisPrimaryTypeClass, isThisPrimaryType, type ThisPrimaryType } from './thisPrimary';
import { VoidPrimaryTypeClass, isVoidPrimaryType, type VoidPrimaryType } from './voidPrimary';
import { SoqlPrimaryTypeClass, isSoqlPrimaryType, type SoqlPrimaryType } from './soqlPrimary';
import { SuperPrimaryTypeClass, isSuperPrimaryType, type SuperPrimaryType } from './superPrimary';
import {
    TypeRefPrimaryTypeClass,
    isTypeRefPrimaryType,
    type TypeRefPrimaryType,
} from './typeRefPrimary';
import { IdPrimaryTypeClass, isIdPrimaryType, type IdPrimaryType } from './idPrimary';
import {
    LiteralPrimaryTypeClass,
    isLiteralPrimaryType,
    type LiteralPrimaryType,
} from './literalPrimary';
import { SoslPrimaryTypeClass, isSoslPrimaryType, type SoslPrimaryType } from './soslPrimary';

export type BasedPrimaryType =
    | PrimaryType
    | ThisPrimaryType
    | VoidPrimaryType
    | SoqlPrimaryType
    | SuperPrimaryType
    | TypeRefPrimaryType
    | IdPrimaryType
    | LiteralPrimaryType
    | SoslPrimaryType;
/** PrimaryVisitor が返すノード (PrimaryContext のラベル付きの 8 種類 + ラベルのない PrimaryContext) */
export type BasedPrimaryTypeClass =
    | PrimaryTypeClass
    | ThisPrimaryTypeClass
    | VoidPrimaryTypeClass
    | SoqlPrimaryTypeClass
    | SuperPrimaryTypeClass
    | TypeRefPrimaryTypeClass
    | IdPrimaryTypeClass
    | LiteralPrimaryTypeClass
    | SoslPrimaryTypeClass;

export const isBasedPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BasedPrimaryTypeClass =>
    isPrimaryType(target) ||
    isThisPrimaryType(target) ||
    isVoidPrimaryType(target) ||
    isSoqlPrimaryType(target) ||
    isSuperPrimaryType(target) ||
    isTypeRefPrimaryType(target) ||
    isIdPrimaryType(target) ||
    isLiteralPrimaryType(target) ||
    isSoslPrimaryType(target);

export class PrimaryVisitor extends ApexCommonVisitor<BasedPrimaryTypeClass> {
    visitPrimary(ctx: PrimaryContext) {
        return PrimaryTypeClass.create(ctx);
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
