import { SubFieldListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { SubFieldEntryTypeClass, EntryVisitor, isSubFieldEntryType } from '../entryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class SubFieldListTypeClass extends ListTypeClass<SubFieldEntryTypeClass> {
    private constructor(list: (SubFieldEntryTypeClass | ErrorTypeClass)[]) {
        super('subFieldList', list);
    }

    static create(ctx: SubFieldListContext): SubFieldListTypeClass {
        if (!ctx.subFieldEntry_list() || ctx.subFieldEntry_list().length === 0) {
            throw new Error('値が異常です。SubFieldListContext: ' + ctx.getText());
        }

        return new SubFieldListTypeClass(
            isValidClassList(
                ctx.subFieldEntry_list(),
                (ctx) => new EntryVisitor().visit(ctx),
                isSubFieldEntryType,
                'subFieldEntry',
            ),
        );
    }
}

export const isSubFieldListType = (target: CommonTypeClass): target is SubFieldListTypeClass => {
    return target instanceof SubFieldListTypeClass;
};

