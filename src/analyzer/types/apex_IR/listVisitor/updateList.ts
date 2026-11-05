import { UpdateListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { UpdateTypeTypeClass, ClauseVisitor, isUpdateTypeType } from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class UpdateListTypeClass extends ListTypeClass<'updateList', UpdateTypeTypeClass> {
    private constructor(value: (UpdateTypeTypeClass | ApexErrorTypeClass)[]) {
        super('updateList', value);
    }

    static create(ctx: UpdateListContext): UpdateListTypeClass {
        if (!ctx.updateType()) {
            throw new Error('値が異常です。UpdateListContext: ' + ctx.getText());
        }

        const value: (UpdateTypeTypeClass | ApexErrorTypeClass)[] = [
            visitNode(new ClauseVisitor(), ctx.updateType(), isUpdateTypeType, 'updateType'),
        ];

        if (ctx.updateList()) {
            const nested = visitNode(
                new ListVisitor(),
                ctx.updateList(),
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

export const isUpdateListType = (
    target: ApexCommonTypeClass<string>,
): target is UpdateListTypeClass => {
    return target instanceof UpdateListTypeClass;
};
