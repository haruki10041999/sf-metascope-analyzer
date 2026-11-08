import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldOrderTypeClass, ClauseVisitor, isFieldOrderType } from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class FieldOrderListTypeClass extends ListTypeClass<'fieldOrderList', FieldOrderTypeClass> {
    private constructor(value: (FieldOrderTypeClass | ApexErrorTypeClass)[]) {
        super('fieldOrderList', value);
    }

    static create(ctx: FieldOrderListContext): FieldOrderListTypeClass {
        if (!ctx.fieldOrder_list() || ctx.fieldOrder_list().length === 0) {
            throw new Error('値が異常です。FieldOrderListContext: ' + ctx.getText());
        }

        return new FieldOrderListTypeClass(
            visitNodeList(
                new ClauseVisitor(),
                ctx.fieldOrder_list(),
                isFieldOrderType,
                'fieldOrder',
            ),
        );
    }
}

export const isFieldOrderListType = (
    target: ApexCommonTypeClass<string>,
): target is FieldOrderListTypeClass => {
    return target instanceof FieldOrderListTypeClass;
};
