import { SignedNumberContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class SignedNumberTypeClass extends PrimitiveLiteralTypeClass<number> {
    private operator: string | null;

    private constructor(value: number, valueType: 'integer' | 'number', operator: string | null) {
        super('signedNumber', value, valueType);
        this.operator = operator;
    }

    static create(ctx: SignedNumberContext): SignedNumberTypeClass {
        if ((!ctx.IntegerLiteral() && !ctx.NumberLiteral()) || (!ctx.ADD() && !ctx.SUB())) {
            throw new Error('値が異常です。SignedNumberContext: ' + ctx.getText());
        }

        let operator: string | null = null;
        if (ctx.ADD()) {
            operator = '+';
        }
        if (ctx.SUB()) {
            operator = '-';
        }
        let value: number;
        let valueType: 'integer' | 'number';
        if (ctx.IntegerLiteral()) {
            value = parseInt(ctx.IntegerLiteral().getText(), 10);
            valueType = 'integer';
        } else {
            value = parseFloat(ctx.NumberLiteral().getText());
            valueType = 'number';
        }

        return new SignedNumberTypeClass(value, valueType, operator);
    }

    getOperator(): string | null {
        return this.operator;
    }

    isOperatorNull(): boolean {
        return this.operator === null;
    }
}

export const isSignedNumberType = (taraget: CommonTypeClass): taraget is SignedNumberTypeClass => {
    return taraget instanceof SignedNumberTypeClass;
};
