import { SignedNumberContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class SignedNumberTypeClass extends PrimitiveLiteralTypeClass<string> {
    private operator: string | null;

    private constructor(value: string, valueType: 'integer' | 'number', operator: string | null) {
        super('signedNumber', value, valueType);
        this.operator = operator;
    }

    static create(ctx: SignedNumberContext): SignedNumberTypeClass {
        if (!ctx.IntegerLiteral() && !ctx.NumberLiteral()) {
            throw new Error('値が異常です。SignedNumberContext: ' + ctx.getText());
        }

        let operator: string | null = null;
        if (ctx.ADD()) {
            operator = '+';
        }
        if (ctx.SUB()) {
            operator = '-';
        }
        let value: string;
        let valueType: 'integer' | 'number';
        if (ctx.IntegerLiteral()) {
            value = ctx.IntegerLiteral().getText();
            valueType = 'integer';
        } else {
            value = ctx.NumberLiteral().getText();
            valueType = 'number';
        }

        return new SignedNumberTypeClass(value, valueType, operator);
    }

    getOperator(): string | null {
        return this.operator;
    }
}

export const isSignedNumberType = (target: CommonTypeClass): target is SignedNumberTypeClass => {
    return target instanceof SignedNumberTypeClass;
};

