import { PrimaryContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type PrimaryType = TypeField<'primary'> & {
    value: string;
};

/** ラベルのない PrimaryContext (ANTLR の回復でできることがある)。テキストだけを持つ */
export class PrimaryTypeClass extends ApexCommonTypeClass<'primary', PrimaryType> {
    private constructor(fields: FieldsOf<PrimaryType>, sourceSpan: SourceSpan) {
        super('primary', fields, sourceSpan);
    }

    static create(ctx: PrimaryContext): PrimaryTypeClass {
        return new PrimaryTypeClass({ value: ctx.getText() }, getSourceSpan(ctx));
    }

    getValue(): PrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PrimaryTypeClass => isSpicifyApexCommonTypeClass('primary', target);
