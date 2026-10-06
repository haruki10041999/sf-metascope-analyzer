import { UpdateListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { UpdateTypeTypeClass, ClauseVisitor, isUpdateTypeType } from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class UpdateListTypeClass extends ListTypeClass<UpdateTypeTypeClass> {
    private constructor(value: (UpdateTypeTypeClass | ErrorTypeClass)[]) {
        super('updateList', value);
    }

    static create(ctx: UpdateListContext): UpdateListTypeClass {
        if (!ctx.updateType()) {
            throw new Error('値が異常です。UpdateListContext: ' + ctx.getText());
        }

        const value: (UpdateTypeTypeClass | ErrorTypeClass)[] = [
            isValidClass(
                new ClauseVisitor().visit(ctx.updateType()),
                isUpdateTypeType,
                'updateType',
            ),
        ];

        if (ctx.updateList()) {
            const nested = isValidClass(
                new ListVisitor().visit(ctx.updateList()),
                isUpdateListType,
                'updateList',
            );

            if (isUpdateListType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        }

        return new UpdateListTypeClass(value);
    }
}

export const isUpdateListType = (target: CommonTypeClass): target is UpdateListTypeClass => {
    return target instanceof UpdateListTypeClass;
};
