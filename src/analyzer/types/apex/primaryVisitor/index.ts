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
        console.log('解析を開始します。' + 'PrimaryContext:  ' + ctx.getText());
        const result = makePrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'PrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitThisPrimary(ctx: ThisPrimaryContext) {
        console.log('解析を開始します。' + 'ThisPrimaryContext:  ' + ctx.getText());
        const result = makeThisPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ThisPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitVoidPrimary(ctx: VoidPrimaryContext) {
        console.log('解析を開始します。' + 'VoidPrimaryContext:  ' + ctx.getText());
        const result = makeVoidPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'VoidPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'SuperPrimaryContext:  ' + ctx.getText());
        const result = makeSuperPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SuperPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'IdPrimaryContext:  ' + ctx.getText());
        const result = makeIdPrimaryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'IdPrimaryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
