import { SubFieldListContext } from '@apexdevtools/apex-parser';

import { SubFieldEntryTypeClass } from '../entryVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SubFieldListType = TypeField<'subFieldList'> & {
    value: SubFieldEntryTypeClass[];
};

export class SubFieldListTypeClass extends ApexCommonTypeClass<'subFieldList', SubFieldListType> {
    private constructor(fields: FieldsOf<SubFieldListType>, sourceSpan: SourceSpan) {
        super('subFieldList', fields, sourceSpan);
    }

    static create(ctx: SubFieldListContext): SubFieldListTypeClass {
        return new SubFieldListTypeClass(
            {
                value: createNodeList(
                    ctx.subFieldEntry_list(),
                    (c) => SubFieldEntryTypeClass.create(c),
                    'subFieldEntry',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SubFieldListType['value'] {
        return this.getFields().value;
    }
}

export const isSubFieldListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SubFieldListTypeClass => isSpicifyApexCommonTypeClass('subFieldList', target);
