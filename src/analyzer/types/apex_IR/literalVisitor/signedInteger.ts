import { SignedIntegerContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class SignedIntegerTypeClass extends PrimitiveLiteralTypeClass<number> {
    private operator: string | null;

    private constructor(value: number, operator: string | null) {
        super('signedInteger', value, 'integer');
        this.operator = operator;
    }

    static create(ctx: SignedIntegerContext): SignedIntegerTypeClass {
        if (!ctx.IntegerLiteral() || (!ctx.ADD() && !ctx.SUB())) {
            throw new Error('値が異常です。SignedIntegerContext: ' + ctx.getText());
        }

        let operator: string | null = null;
        if (ctx.ADD()) {
            operator = '+';
        }
        if (ctx.SUB()) {
            operator = '-';
        }
        const value = parseInt(ctx.IntegerLiteral().getText(), 10);

        return new SignedIntegerTypeClass(value, operator);
    }

    getOperator(): string | null {
        return this.operator;
    }
}

export const isSignedIntegerType = (
    taraget: CommonTypeClass,
): taraget is SignedIntegerTypeClass => {
    return taraget instanceof SignedIntegerTypeClass;
};
