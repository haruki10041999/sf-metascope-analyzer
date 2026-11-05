import { FieldGroupByListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldGroupByTypeClass, ClauseVisitor, isFieldGroupByType } from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class FieldGroupByListTypeClass extends ListTypeClass<
    'fieldGroupByList',
    FieldGroupByTypeClass
> {
    private constructor(value: (FieldGroupByTypeClass | ApexErrorTypeClass)[]) {
        super('fieldGroupByList', value);
    }

    static create(ctx: FieldGroupByListContext): FieldGroupByListTypeClass {
        if (!ctx.fieldGroupBy_list() || ctx.fieldGroupBy_list().length === 0) {
            throw new Error('値が異常です。FieldGroupByListContext: ' + ctx.getText());
        }

        return new FieldGroupByListTypeClass(
            visitNodeList(
                new ClauseVisitor(),
                ctx.fieldGroupBy_list(),
                isFieldGroupByType,
                'fieldGroupBy',
            ),
        );
    }
}

export const isFieldGroupByListType = (
    target: ApexCommonTypeClass<string>,
): target is FieldGroupByListTypeClass => {
    return target instanceof FieldGroupByListTypeClass;
};
