import { VoidPrimaryContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type VoidPrimaryType = TypeField<'voidPrimary'> & {
    /** 常に 'void.class' (Apex は大文字・小文字を区別しないので、ソースの書き方によらず小文字にそろえる) */
    value: 'void.class';
};

export class VoidPrimaryTypeClass extends ApexCommonTypeClass<'voidPrimary', VoidPrimaryType> {
    private constructor(fields: FieldsOf<VoidPrimaryType>, sourceSpan: SourceSpan) {
        super('voidPrimary', fields, sourceSpan);
    }

    static create(ctx: VoidPrimaryContext): VoidPrimaryTypeClass {
        if (!ctx.VOID() || !ctx.CLASS()) {
            throw new Error('値が異常です。VoidPrimaryContext: ' + ctx.getText());
        }

        return new VoidPrimaryTypeClass({ value: 'void.class' }, getSourceSpan(ctx));
    }

    getValue(): VoidPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isVoidPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is VoidPrimaryTypeClass => isSpicifyApexCommonTypeClass('voidPrimary', target);
