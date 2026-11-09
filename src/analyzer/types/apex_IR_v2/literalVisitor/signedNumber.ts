import { SignedNumberContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SignedNumberType = TypeField<'signedNumber'> & {
    value: string;
    valueType: 'integer' | 'number';
    operator: '+' | '-' | null;
};

export class SignedNumberTypeClass extends ApexCommonTypeClass<'signedNumber', SignedNumberType> {
    private constructor(fields: FieldsOf<SignedNumberType>, sourceSpan: SourceSpan) {
        super('signedNumber', fields, sourceSpan);
    }

    static create(ctx: SignedNumberContext): SignedNumberTypeClass {
        let value: string;
        let valueType: SignedNumberType['valueType'];
        if (ctx.IntegerLiteral()) {
            value = ctx.IntegerLiteral().getText();
            valueType = 'integer';
        } else if (ctx.NumberLiteral()) {
            value = ctx.NumberLiteral().getText();
            valueType = 'number';
        } else {
            throw new Error('値が異常です。SignedNumberContext: ' + ctx.getText());
        }

        return new SignedNumberTypeClass(
            {
                value,
                valueType,
                operator: ctx.SUB() ? '-' : ctx.ADD() ? '+' : null,
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SignedNumberType['value'] {
        return this.getFields().value;
    }

    getValueType(): SignedNumberType['valueType'] {
        return this.getFields().valueType;
    }

    getOperator(): SignedNumberType['operator'] {
        return this.getFields().operator;
    }
}

export const isSignedNumberType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SignedNumberTypeClass => isSpicifyApexCommonTypeClass('signedNumber', target);
