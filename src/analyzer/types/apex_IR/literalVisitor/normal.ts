import { LiteralContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

type LiteralValueType = string | number | boolean | null | string[];

export class NormalLiteralTypeClass extends PrimitiveLiteralTypeClass<LiteralValueType> {
    constructor(value: LiteralValueType | ErrorTypeClass, valueType: string) {
        super('literal', value, valueType);
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

        let value: LiteralValueType | ErrorTypeClass;
        let valueType: string;
        if (ctx.IntegerLiteral()) {
            value = parseInt(ctx.IntegerLiteral().getText(), 10);
            valueType = 'integer';
        } else if (ctx.LongLiteral()) {
            value = parseInt(ctx.LongLiteral().getText(), 10);
            valueType = 'long';
        } else if (ctx.NumberLiteral()) {
            value = parseFloat(ctx.NumberLiteral().getText());
            valueType = 'number';
        } else if (ctx.StringLiteral()) {
            value = ctx.StringLiteral().getText();
            valueType = 'string';
        } else if (ctx.MultilineStringLiteral()) {
            value = ctx.MultilineStringLiteral().getText().split('\n');
            valueType = 'multilineString';
        } else if (ctx.BooleanLiteral()) {
            value = ctx.BooleanLiteral().getText() === 'true';
            valueType = 'boolean';
        } else {
            value = null;
            valueType = 'null';
        }

        return new NormalLiteralTypeClass(value, valueType);
    }
}

export const isNormalLiteralType = (target: CommonTypeClass): target is NormalLiteralTypeClass => {
    return target instanceof NormalLiteralTypeClass;
};
