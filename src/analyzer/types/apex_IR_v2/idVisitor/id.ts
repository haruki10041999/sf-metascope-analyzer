import { IdContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type IdType = TypeField<'id'> & {
    value: string;
};

export class IdTypeClass extends ApexCommonTypeClass<'id', IdType> {
    private constructor(fields: FieldsOf<IdType>, sourceSpan: SourceSpan) {
        super('id', fields, sourceSpan);
    }

    static create(ctx: IdContext): IdTypeClass {
        return new IdTypeClass({ value: ctx.getText() }, getSourceSpan(ctx));
    }

    getValue(): IdType['value'] {
        return this.getFields().value;
    }
}

export const isIdType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is IdTypeClass => isSpicifyApexCommonTypeClass('id', target);
