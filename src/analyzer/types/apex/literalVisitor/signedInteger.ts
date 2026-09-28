import { SignedIntegerContext } from '@apexdevtools/apex-parser';

export type SignedIntegerType = {
    type: 'signedInteger';
    literal: {
        value: string;
        operator?: '+' | '-';
    };
};

export const makeSignedIntegerType = (ctx: SignedIntegerContext): SignedIntegerType => {
    if (ctx.ADD()) {
        return {
            type: 'signedInteger',
            literal: {
                value: ctx.IntegerLiteral().getText(),
                operator: '+',
            },
        };
    }

    if (ctx.SUB()) {
        return {
            type: 'signedInteger',
            literal: {
                value: ctx.IntegerLiteral().getText(),
                operator: '-',
            },
        };
    }

    return {
        type: 'signedInteger',
        literal: {
            value: ctx.IntegerLiteral().getText(),
        },
    };
};

