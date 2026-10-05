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

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalLiteralType, NormalLiteralTypeClass } from './normal';
export { isWhenLiteralType, WhenLiteralTypeClass } from './whenLiteral';
export { isSignedIntegerType, SignedIntegerTypeClass } from './signedInteger';
export { isSignedNumberType, SignedNumberTypeClass } from './signedNumber';

export class LiteralTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class PrimitiveLiteralTypeClass<T> extends CommonTypeClass {
    private valueType: string;
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass, valueType: string) {
        super(type);
        this.value = value;
        this.valueType = valueType;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }
}

export type LiteralAllTypeClass = LiteralTypeClass<unknown> | PrimitiveLiteralTypeClass<unknown>;

export const isLiteralTypeAll = (target: CommonTypeClass): target is LiteralAllTypeClass => {
    return target instanceof LiteralTypeClass || target instanceof PrimitiveLiteralTypeClass;
};

export class LiteralVisitor extends CommonVisitor<LiteralAllTypeClass> {
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
