import { SignedNumberContext } from '@apexdevtools/apex-parser';

export type SignedNumberType = {
    type: 'signedNumber';
    literal: {
        type: 'integer' | 'number';
        value: string;
        operator?: '+' | '-';
    };
};

export const makeSignedNumberType = (ctx: SignedNumberContext): SignedNumberType => {
    let valueType: 'integer' | 'number' | undefined = undefined;
    let value = '';
    if (ctx.IntegerLiteral()) {
        valueType = 'integer';
        value = ctx.IntegerLiteral().getText();
    }

    if (ctx.NumberLiteral()) {
        valueType = 'number';
        value = ctx.NumberLiteral().getText();
    }

    if (!valueType) {
        throw new Error('値が異常です。SignedNumberContext: ' + ctx.getText());
    }

    if (ctx.ADD()) {
        return {
            type: 'signedNumber',
            literal: {
                type: valueType,
                value: value,
                operator: '+',
            },
        };
    }

    if (ctx.SUB()) {
        return {
            type: 'signedNumber',
            literal: {
                type: valueType,
                value: value,
                operator: '-',
            },
        };
    }

    return {
        type: 'signedNumber',
        literal: {
            type: valueType,
            value: value,
        },
    };
};

