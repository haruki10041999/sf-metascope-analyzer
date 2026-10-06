import { FieldGroupByListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldGroupByTypeClass, ClauseVisitor, isFieldGroupByType } from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class FieldGroupByListTypeClass extends ListTypeClass<FieldGroupByTypeClass> {
    private constructor(value: (FieldGroupByTypeClass | ErrorTypeClass)[]) {
        super('fieldGroupByList', value);
    }

    static create(ctx: FieldGroupByListContext): FieldGroupByListTypeClass {
        if (!ctx.fieldGroupBy_list() || ctx.fieldGroupBy_list().length === 0) {
            throw new Error('値が異常です。FieldGroupByListContext: ' + ctx.getText());
        }

        return new FieldGroupByListTypeClass(
            isValidClassList(
                ctx.fieldGroupBy_list(),
                (ctx) => new ClauseVisitor().visit(ctx),
                isFieldGroupByType,
                'fieldGroupBy',
            ),
        );
    }
}

export const isFieldGroupByListType = (
    target: CommonTypeClass,
): target is FieldGroupByListTypeClass => {
    return target instanceof FieldGroupByListTypeClass;
};
