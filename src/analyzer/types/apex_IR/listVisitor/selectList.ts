import { SelectListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { SelectEntryTypeClass, EntryVisitor, isSelectEntryType } from '../entryVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class SelectListTypeClass extends ListTypeClass<'selectList', SelectEntryTypeClass> {
    private constructor(list: (SelectEntryTypeClass | ApexErrorTypeClass)[]) {
        super('selectList', list);
    }

    static create(ctx: SelectListContext): SelectListTypeClass {
        if (!ctx.selectEntry_list() || ctx.selectEntry_list().length === 0) {
            throw new Error('値が異常です。SelectListContext: ' + ctx.getText());
        }

        return new SelectListTypeClass(
            isApexValidClassList(
                ctx.selectEntry_list(),
                (ctx) => new EntryVisitor().visit(ctx),
                isSelectEntryType,
                'selectEntry',
            ),
        );
    }
}

export const isSelectListType = (
    target: ApexCommonTypeClass<string>,
): target is SelectListTypeClass => {
    return target instanceof SelectListTypeClass;
};

