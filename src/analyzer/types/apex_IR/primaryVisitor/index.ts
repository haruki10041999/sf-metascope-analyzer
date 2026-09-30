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

import { PrimaryTypeClass as primaryTypeClass } from './primary';
import { ThisPrimaryTypeClass } from './thisPrimary';
import { VoidPrimaryTypeClass } from './voidPrimary';
import { SoqlPrimaryType, makeSoqlPrimaryType } from './soqlPrimary';
import { SuperPrimaryTypeClass } from './superPrimary';
import { TypeRefPrimaryType, makeTypeRefPrimaryType } from './typeRefPrimary';
import { IdPrimaryTypeClass } from './idPrimary';
import { LiteralPrimaryType, makeLiteralPrimaryType } from './literalPrimary';
import { SoslPrimaryType, makeSoslPrimaryType } from './soslPrimary';

import { ContextTypeClass, ErrorTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isPrimaryType } from './primary';
export { isThisPrimaryType } from './thisPrimary';
export { isVoidPrimaryType } from './voidPrimary';
export { isSuperPrimaryType } from './superPrimary';
export { isIdPrimaryType } from './idPrimary';

export class PrimaryTypeClass extends ContextTypeClass {
    constructor(type: string, value: any | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isPrimaryTypeAll = (target: CommonTypeClass): target is PrimaryTypeClass => {
    return target instanceof PrimaryTypeClass;
};

export class PrimaryVisitor extends CommonVisitor<PrimaryTypeClass> {
    visitPrimary(ctx: PrimaryContext) {
        return primaryTypeClass.create(ctx);
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
        console.log('解析を開始します。' + 'TypeRefPrimaryContext:  ' + ctx.getText());
        const result = makeTypeRefPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeRefPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitIdPrimary(ctx: IdPrimaryContext) {
        return IdPrimaryTypeClass.create(ctx);
    }

    visitLiteralPrimary(ctx: LiteralPrimaryContext) {
        console.log('解析を開始します。' + 'LiteralPrimaryContext:  ' + ctx.getText());
        const result = makeLiteralPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LiteralPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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

