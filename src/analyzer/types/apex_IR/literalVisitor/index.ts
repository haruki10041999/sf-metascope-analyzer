import {
    ApexParserBaseVisitor,
    LiteralContext,
    WhenLiteralContext,
    SoslLiteralContext,
    SoslLiteralAltContext,
    SignedIntegerContext,
    SignedNumberContext,
    SoqlLiteralContext,
} from '@apexdevtools/apex-parser';

import { LiteralType as literalType, makeLiteralType } from './literal';
import { WhenLiteralType, makeWhenLiteralType } from './whenLiteral';
import { SoslLiteralType, makeSoslLiteralType } from './soslLiteral';
import { SoslLiteralAltType, makeSoslLiteralAltType } from './soslLiteralAlt';
import { SignedIntegerType, makeSignedIntegerType } from './signedInteger';
import { SignedNumberType, makeSignedNumberType } from './signedNumber';
import { SoqlLiteralType, makeSoqlLiteralType } from './soqlLiteral';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type LiteralType =
    | literalType
    | WhenLiteralType
    | SoslLiteralType
    | SoslLiteralAltType
    | SignedIntegerType
    | SignedNumberType
    | SoqlLiteralType
    | ErrorType;

export class LiteralVisitor extends CommonVisitor<LiteralType> {
    visitLiteral(ctx: LiteralContext) {
        console.log('解析を開始します。' + 'LiteralContext:  ' + ctx.getText());
        const result = makeLiteralType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LiteralContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhenLiteral(ctx: WhenLiteralContext) {
        console.log('解析を開始します。' + 'WhenLiteralContext:  ' + ctx.getText());
        const result = makeWhenLiteralType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhenLiteralContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoslLiteral(ctx: SoslLiteralContext) {
        console.log('解析を開始します。' + 'SoslLiteralContext:  ' + ctx.getText());
        const result = makeSoslLiteralType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoslLiteralContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoslLiteralAlt(ctx: SoslLiteralAltContext) {
        console.log('解析を開始します。' + 'SoslLiteralAltContext:  ' + ctx.getText());
        const result = makeSoslLiteralAltType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoslLiteralAltContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSignedInteger(ctx: SignedIntegerContext) {
        console.log('解析を開始します。' + 'SignedIntegerContext:  ' + ctx.getText());
        const result = makeSignedIntegerType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SignedIntegerContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSignedNumber(ctx: SignedNumberContext) {
        console.log('解析を開始します。' + 'SignedNumberContext:  ' + ctx.getText());
        const result = makeSignedNumberType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SignedNumberContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoqlLiteral(ctx: SoqlLiteralContext) {
        console.log('解析を開始します。' + 'SoqlLiteralContext:  ' + ctx.getText());
        const result = makeSoqlLiteralType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoqlLiteralContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
