import { SelectListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { SelectEntryTypeClass, EntryVisitor, isSelectEntryType } from '../entryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class SelectListTypeClass extends ListTypeClass<SelectEntryTypeClass> {
    private constructor(list: (SelectEntryTypeClass | ErrorTypeClass)[]) {
        super('selectList', list);
    }

    static create(ctx: SelectListContext): SelectListTypeClass {
        if (!ctx.selectEntry_list() || ctx.selectEntry_list().length === 0) {
            throw new Error('値が異常です。SelectListContext: ' + ctx.getText());
        }

        return new SelectListTypeClass(
            isValidClassList(
                ctx.selectEntry_list(),
                (ctx) => new EntryVisitor().visit(ctx),
                isSelectEntryType,
                'selectEntry',
            ),
        );
    }
}

export const isSelectListType = (target: CommonTypeClass): target is SelectListTypeClass => {
    return target instanceof SelectListTypeClass;
};

