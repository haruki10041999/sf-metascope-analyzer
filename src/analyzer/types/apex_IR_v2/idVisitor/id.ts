import { IdContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type IdType = TypeField<'id'> & {
    value: string;
};

export class IdTypeClass extends ApexCommonTypeClass<'id', IdType> {
    private constructor(value: string, sourceSpan: SourceSpan) {
        super('id', { value: value }, sourceSpan);
    }

    static create(ctx: IdContext): IdTypeClass {
        return new IdTypeClass(ctx.getText(), getSourceSpan(ctx));
    }

    getValue(): IdType['value'] {
        return this.getFields().value;
    }
}

export const isIdType = (
    target: ApexCommonTypeClass<string, TypeField<'id'>>,
): target is IdTypeClass => {
    return isSpicifyApexCommonTypeClass('id', target);
};
