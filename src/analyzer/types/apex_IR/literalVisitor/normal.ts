import { LiteralContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

type LiteralValueType = string | number | boolean | null | string[];

export class NormalLiteralTypeClass extends PrimitiveLiteralTypeClass<LiteralValueType> {
    constructor(value: LiteralValueType | null, valueType: string | null) {
        super('literal', value, valueType, {});
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

        let value: LiteralValueType | null = null;
        let valueType: string | null = null;
        if (ctx.IntegerLiteral()) {
            value = parseInt(ctx.IntegerLiteral().getText(), 10);
            valueType = 'integer';
        }

        if (ctx.LongLiteral()) {
            value = parseInt(ctx.LongLiteral().getText(), 10);
            valueType = 'long';
        }

        if (ctx.NumberLiteral()) {
            value = parseFloat(ctx.NumberLiteral().getText());
            valueType = 'number';
        }

        if (ctx.StringLiteral()) {
            value = ctx.StringLiteral().getText();
            valueType = 'string';
        }

        if (ctx.MultilineStringLiteral()) {
            value = ctx.MultilineStringLiteral().getText().split('\n');
            valueType = 'multilineString';
        }

        if (ctx.BooleanLiteral()) {
            value = ctx.BooleanLiteral().getText() === 'true';
            valueType = 'boolean';
        }

        if (ctx.NULL()) {
            value = null;
            valueType = 'null';
        }

        return new NormalLiteralTypeClass(value, valueType);
    }
}

export const isNormalLiteralType = (target: CommonTypeClass): target is NormalLiteralTypeClass => {
    return target instanceof NormalLiteralTypeClass;
};
