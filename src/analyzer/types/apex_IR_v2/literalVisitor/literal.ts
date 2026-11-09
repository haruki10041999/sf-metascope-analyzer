import { LiteralContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

type LiteralValueType = 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';

export type LiteralType = TypeField<'literal'> & {
    value: string;
    valueType: LiteralValueType;
};

export class LiteralTypeClass extends ApexCommonTypeClass<'literal', LiteralType> {
    private constructor(fields: FieldsOf<LiteralType>, sourceSpan: SourceSpan) {
        super('literal', fields, sourceSpan);
    }

    static create(ctx: LiteralContext): LiteralTypeClass {
        let value: string;
        let valueType: LiteralValueType;
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
            valueType = 'longText';
        } else if (ctx.BooleanLiteral()) {
            value = ctx.BooleanLiteral().getText();
            valueType = 'boolean';
        } else if (ctx.NULL()) {
            value = 'null';
            valueType = 'null';
        } else {
            throw new Error('値が異常です。LiteralContext: ' + ctx.getText());
        }

        return new LiteralTypeClass({ value, valueType }, getSourceSpan(ctx));
    }

    getValue(): LiteralType['value'] {
        return this.getFields().value;
    }

    getValueType(): LiteralType['valueType'] {
        return this.getFields().valueType;
    }
}

export const isLiteralType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LiteralTypeClass => isSpicifyApexCommonTypeClass('literal', target);
