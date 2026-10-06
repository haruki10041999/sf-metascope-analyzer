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

import { NormalPrimaryTypeClass } from './normal';
import { ThisPrimaryTypeClass } from './thisPrimary';
import { VoidPrimaryTypeClass } from './voidPrimary';
import { SoqlPrimaryType, makeSoqlPrimaryType } from './soqlPrimary';
import { SuperPrimaryTypeClass } from './superPrimary';
import { TypeRefPrimaryTypeClass } from './typeRefPrimary';
import { IdPrimaryTypeClass } from './idPrimary';
import { LiteralPrimaryTypeClass } from './literalPrimary';
import { SoslPrimaryType, makeSoslPrimaryType } from './soslPrimary';

import { ErrorTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isNormalPrimaryType, NormalPrimaryTypeClass } from './normal';
export { isThisPrimaryType, ThisPrimaryTypeClass } from './thisPrimary';
export { isVoidPrimaryType, VoidPrimaryTypeClass } from './voidPrimary';
export { isSuperPrimaryType, SuperPrimaryTypeClass } from './superPrimary';
export { isIdPrimaryType, IdPrimaryTypeClass } from './idPrimary';
export { isLiteralPrimaryType, LiteralPrimaryTypeClass } from './literalPrimary';

export class PrimaryTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isPrimaryTypeAll = (target: CommonTypeClass): target is PrimaryTypeClass<unknown> => {
    return target instanceof PrimaryTypeClass;
};

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
        console.log('解析を開始します。' + 'SoqlPrimaryContext:  ' + ctx.getText());
        const result = makeSoqlPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoqlPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'SoslPrimaryContext:  ' + ctx.getText());
        const result = makeSoslPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoslPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}

