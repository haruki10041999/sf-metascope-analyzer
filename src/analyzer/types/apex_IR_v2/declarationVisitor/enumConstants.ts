import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type EnumConstantsType = TypeField<'enumConstants'> & {
    constants: IdTypeClass[];
};

export class EnumConstantsTypeClass extends ApexCommonTypeClass<
    'enumConstants',
    EnumConstantsType
> {
    private constructor(fields: FieldsOf<EnumConstantsType>, sourceSpan: SourceSpan) {
        super('enumConstants', fields, sourceSpan);
    }

    static create(ctx: EnumConstantsContext): EnumConstantsTypeClass {
        return new EnumConstantsTypeClass(
            { constants: createNodeList(ctx.id_list(), (c) => IdTypeClass.create(c), 'id') },
            getSourceSpan(ctx),
        );
    }

    getConstants(): EnumConstantsType['constants'] {
        return this.getFields().constants;
    }
}

export const isEnumConstantsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is EnumConstantsTypeClass => {
    return isSpicifyApexCommonTypeClass('enumConstants', target);
};
