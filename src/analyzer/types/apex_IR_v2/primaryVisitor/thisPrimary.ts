import { ThisPrimaryContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type ThisPrimaryType = TypeField<'thisPrimary'> & {
    /** 常に 'this' (Apex は大文字・小文字を区別しないので、ソースの書き方によらず小文字にそろえる) */
    value: 'this';
};

export class ThisPrimaryTypeClass extends ApexCommonTypeClass<'thisPrimary', ThisPrimaryType> {
    private constructor(fields: FieldsOf<ThisPrimaryType>, sourceSpan: SourceSpan) {
        super('thisPrimary', fields, sourceSpan);
    }

    static create(ctx: ThisPrimaryContext): ThisPrimaryTypeClass {
        if (!ctx.THIS()) {
            throw new Error('値が異常です。ThisPrimaryContext: ' + ctx.getText());
        }

        return new ThisPrimaryTypeClass({ value: 'this' }, getSourceSpan(ctx));
    }

    getValue(): ThisPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isThisPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ThisPrimaryTypeClass => isSpicifyApexCommonTypeClass('thisPrimary', target);
