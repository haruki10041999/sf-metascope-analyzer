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

import { NormalLiteralTypeClass } from './normal';
import { WhenLiteralType, makeWhenLiteralType } from './whenLiteral';
import { SoslLiteralType, makeSoslLiteralType } from './soslLiteral';
import { SoslLiteralAltType, makeSoslLiteralAltType } from './soslLiteralAlt';
import { SignedIntegerType, makeSignedIntegerType } from './signedInteger';
import { SignedNumberType, makeSignedNumberType } from './signedNumber';
import { SoqlLiteralType, makeSoqlLiteralType } from './soqlLiteral';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalLiteralType, NormalLiteralTypeClass } from './normal';

export class LiteralTypeClass<T> extends ContextTypeClass<T> {
    private valueType: string | null = null;
    private rawValue: any | null = null;

    constructor(
        type: string,
        value: T | null,
        valueType: string | null,
        rawValue: any | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, value, errorClasses);
        this.valueType = valueType;
        this.rawValue = rawValue;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }
    getRawValue(): any | null {
        return this.rawValue;
    }

    isRawValueNull(): boolean {
        return this.rawValue === null;
    }
}

export const isLiteralTypeAll = (target: CommonTypeClass): target is LiteralTypeClass<unknown> => {
    return target instanceof LiteralTypeClass;
};

export class LiteralVisitor extends CommonVisitor<LiteralTypeClass<unknown>> {
    visitLiteral(ctx: LiteralContext) {
        return NormalLiteralTypeClass.create(ctx);
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
