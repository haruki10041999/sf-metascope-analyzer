import { SignedIntegerContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class SignedIntegerTypeClass extends PrimitiveLiteralTypeClass<
    'signedInteger',
    string,
    'integer'
> {
    private operator: '+' | '-' | null;

    private constructor(value: string, operator: '+' | '-' | null) {
        super('signedInteger', value, 'integer');
        this.operator = operator;
    }

    static create(ctx: SignedIntegerContext): SignedIntegerTypeClass {
        if (!ctx.IntegerLiteral()) {
            throw new Error('値が異常です。SignedIntegerContext: ' + ctx.getText());
        }

        let operator: '+' | '-' | null = null;
        if (ctx.ADD()) {
            operator = '+';
        } else if (ctx.SUB()) {
            operator = '-';
        }
        const value = ctx.IntegerLiteral().getText();

        return new SignedIntegerTypeClass(value, operator);
    }

    getOperator(): '+' | '-' | null {
        return this.operator;
    }
}

export const isSignedIntegerType = (
    target: CommonTypeClass<string>,
): target is SignedIntegerTypeClass => {
    return target instanceof SignedIntegerTypeClass;
};
