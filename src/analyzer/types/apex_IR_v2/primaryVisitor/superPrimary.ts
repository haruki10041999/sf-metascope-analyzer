import { SuperPrimaryContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type SuperPrimaryType = TypeField<'superPrimary'> & {
    /** 常に 'super' (Apex は大文字・小文字を区別しないので、ソースの書き方によらず小文字にそろえる) */
    value: 'super';
};

export class SuperPrimaryTypeClass extends ApexCommonTypeClass<'superPrimary', SuperPrimaryType> {
    private constructor(fields: FieldsOf<SuperPrimaryType>, sourceSpan: SourceSpan) {
        super('superPrimary', fields, sourceSpan);
    }

    static create(ctx: SuperPrimaryContext): SuperPrimaryTypeClass {
        if (!ctx.SUPER()) {
            throw new Error('値が異常です。SuperPrimaryContext: ' + ctx.getText());
        }

        return new SuperPrimaryTypeClass({ value: 'super' }, getSourceSpan(ctx));
    }

    getValue(): SuperPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isSuperPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SuperPrimaryTypeClass => isSpicifyApexCommonTypeClass('superPrimary', target);
