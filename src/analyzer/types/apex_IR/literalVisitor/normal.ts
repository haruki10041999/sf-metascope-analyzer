import { LiteralContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class NormalLiteralTypeClass extends LiteralTypeClass {
    constructor(value: any | null, valueType: string | null, rawValue: string | null) {
        super('literal', value, valueType, rawValue, {});
    }

    static create(ctx: LiteralContext): NormalLiteralTypeClass {
        if (
            !ctx.IntegerLiteral() &&
            !ctx.LongLiteral() &&
            !ctx.NumberLiteral() &&
            !ctx.StringLiteral() &&
            !ctx.MultilineStringLiteral() &&
            !ctx.BooleanLiteral() &&
            !ctx.NULL()
        ) {
            throw new Error('値が異常です。LiteralContext: ' + ctx.getText());
        }

        let value: any | null = null;
        let rawValue: any | null = null;
        let valueType: string | null = null;
        if (ctx.IntegerLiteral()) {
            rawValue = ctx.IntegerLiteral().getText();
            value = parseInt(rawValue, 10);
            valueType = 'integer';
        }

        if (ctx.LongLiteral()) {
            rawValue = ctx.LongLiteral().getText();
            value = parseInt(rawValue, 10);
            valueType = 'long';
        }

        if (ctx.NumberLiteral()) {
            rawValue = ctx.NumberLiteral().getText();
            value = parseFloat(rawValue);
            valueType = 'number';
        }

        if (ctx.StringLiteral()) {
            rawValue = ctx.StringLiteral().getText();
            value = rawValue;
            valueType = 'string';
        }

        if (ctx.MultilineStringLiteral()) {
            rawValue = ctx.MultilineStringLiteral().getText();
            value = rawValue.split('\n');
            valueType = 'multilineString';
        }

        if (ctx.BooleanLiteral()) {
            rawValue = ctx.BooleanLiteral().getText();
            value = rawValue === 'true';
            valueType = 'boolean';
        }

        if (ctx.NULL()) {
            rawValue = ctx.NULL().getText();
            value = null;
            valueType = 'null';
        }

        return new NormalLiteralTypeClass(value, valueType, rawValue);
    }
}

export const isNormalLiteralType = (target: CommonTypeClass): target is NormalLiteralTypeClass => {
    return target instanceof NormalLiteralTypeClass;
};
