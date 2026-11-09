import { SelectListContext } from '@apexdevtools/apex-parser';

import { SelectEntryTypeClass } from '../entryVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SelectListType = TypeField<'selectList'> & {
    value: SelectEntryTypeClass[];
};

export class SelectListTypeClass extends ApexCommonTypeClass<'selectList', SelectListType> {
    private constructor(fields: FieldsOf<SelectListType>, sourceSpan: SourceSpan) {
        super('selectList', fields, sourceSpan);
    }

    static create(ctx: SelectListContext): SelectListTypeClass {
        return new SelectListTypeClass(
            {
                value: createNodeList(
                    ctx.selectEntry_list(),
                    (c) => SelectEntryTypeClass.create(c),
                    'selectEntry',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SelectListType['value'] {
        return this.getFields().value;
    }
}

export const isSelectListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SelectListTypeClass => isSpicifyApexCommonTypeClass('selectList', target);
