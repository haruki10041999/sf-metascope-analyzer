import { AnyIdContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnyIdType = TypeField<'anyId'> & {
    value: string;
};

export class AnyIdTypeClass extends ApexCommonTypeClass<'anyId', AnyIdType> {
    private constructor(fields: FieldsOf<AnyIdType>, sourceSpan: SourceSpan) {
        super('anyId', fields, sourceSpan);
    }

    static create(ctx: AnyIdContext): AnyIdTypeClass {
        return new AnyIdTypeClass({ value: ctx.getText() }, getSourceSpan(ctx));
    }

    getValue(): AnyIdType['value'] {
        return this.getFields().value;
    }
}

export const isAnyIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnyIdTypeClass => isSpicifyApexCommonTypeClass('anyId', target);
