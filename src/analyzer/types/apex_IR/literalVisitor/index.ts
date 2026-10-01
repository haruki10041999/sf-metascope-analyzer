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
import { WhenLiteralTypeClass } from './whenLiteral';
import { SoslLiteralType, makeSoslLiteralType } from './soslLiteral';
import { SoslLiteralAltType, makeSoslLiteralAltType } from './soslLiteralAlt';
import { SignedIntegerTypeClass } from './signedInteger';
import { SignedNumberTypeClass } from './signedNumber';
import { SoqlLiteralType, makeSoqlLiteralType } from './soqlLiteral';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalLiteralType, NormalLiteralTypeClass } from './normal';
export { isWhenLiteralType, WhenLiteralTypeClass } from './whenLiteral';
export { isSignedIntegerType, SignedIntegerTypeClass } from './signedInteger';
export { isSignedNumberType, SignedNumberTypeClass } from './signedNumber';
export class LiteralTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export class PrimitiveLiteralTypeClass<T> extends LiteralTypeClass<T> {
    private valueType: string | null;

    constructor(
        type: string,
        value: T | null,
        valueType: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, value, errorClasses);
        this.valueType = valueType;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
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
        return WhenLiteralTypeClass.create(ctx);
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
        return SignedIntegerTypeClass.create(ctx);
    }

    visitSignedNumber(ctx: SignedNumberContext) {
        return SignedNumberTypeClass.create(ctx);
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
