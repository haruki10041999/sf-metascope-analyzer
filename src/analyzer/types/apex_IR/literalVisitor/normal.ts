import { LiteralContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class NormalLiteralTypeClass extends PrimitiveLiteralTypeClass<string> {
    private constructor(value: string | ErrorTypeClass, valueType: string) {
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

        let value: string | ErrorTypeClass;
        let valueType: string;
        if (ctx.IntegerLiteral()) {
            value = ctx.IntegerLiteral().getText();
            valueType = 'integer';
        } else if (ctx.LongLiteral()) {
            value = ctx.LongLiteral().getText();
            valueType = 'long';
        } else if (ctx.NumberLiteral()) {
            value = ctx.NumberLiteral().getText();
            valueType = 'number';
        } else if (ctx.StringLiteral()) {
            value = ctx.StringLiteral().getText();
            valueType = 'string';
        } else if (ctx.MultilineStringLiteral()) {
            value = ctx.MultilineStringLiteral().getText();
            valueType = 'multilineString';
        } else if (ctx.BooleanLiteral()) {
            value = ctx.BooleanLiteral().getText();
            valueType = 'boolean';
        } else {
            value = 'null';
            valueType = 'null';
        }

        return new NormalLiteralTypeClass(value, valueType);
    }
}

export const isNormalLiteralType = (target: CommonTypeClass): target is NormalLiteralTypeClass => {
    return target instanceof NormalLiteralTypeClass;
};
