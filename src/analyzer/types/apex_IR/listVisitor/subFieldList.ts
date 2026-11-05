import { SubFieldListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { SubFieldEntryTypeClass, EntryVisitor, isSubFieldEntryType } from '../entryVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class SubFieldListTypeClass extends ListTypeClass<'subFieldList', SubFieldEntryTypeClass> {
    private constructor(list: (SubFieldEntryTypeClass | ApexErrorTypeClass)[]) {
        super('subFieldList', list);
    }

    static create(ctx: SubFieldListContext): SubFieldListTypeClass {
        if (!ctx.subFieldEntry_list() || ctx.subFieldEntry_list().length === 0) {
            throw new Error('値が異常です。SubFieldListContext: ' + ctx.getText());
        }

        return new SubFieldListTypeClass(
            visitNodeList(
                new EntryVisitor(),
                ctx.subFieldEntry_list(),
                isSubFieldEntryType,
                'subFieldEntry',
            ),
        );
    }
}

export const isSubFieldListType = (
    target: ApexCommonTypeClass<string>,
): target is SubFieldListTypeClass => {
    return target instanceof SubFieldListTypeClass;
};
