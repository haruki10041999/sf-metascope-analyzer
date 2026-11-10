import { SignedIntegerContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SignedIntegerType = TypeField<'signedInteger'> & {
    value: string;
    valueType: 'integer';
    operator: '+' | '-' | null;
};

export class SignedIntegerTypeClass extends ApexCommonTypeClass<
    'signedInteger',
    SignedIntegerType
> {
    private constructor(fields: FieldsOf<SignedIntegerType>, sourceSpan: SourceSpan) {
        super('signedInteger', fields, sourceSpan);
    }

    static create(ctx: SignedIntegerContext): SignedIntegerTypeClass {
        if (!ctx.IntegerLiteral()) {
            throw new Error('値が異常です。SignedIntegerContext: ' + ctx.getText());
        }

        return new SignedIntegerTypeClass(
            {
                value: ctx.IntegerLiteral().getText(),
                valueType: 'integer',
                operator: ctx.ADD() ? '+' : ctx.SUB() ? '-' : null,
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SignedIntegerType['value'] {
        return this.getFields().value;
    }

    getValueType(): SignedIntegerType['valueType'] {
        return this.getFields().valueType;
    }

    getOperator(): SignedIntegerType['operator'] {
        return this.getFields().operator;
    }
}

export const isSignedIntegerType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SignedIntegerTypeClass => isSpicifyApexCommonTypeClass('signedInteger', target);
