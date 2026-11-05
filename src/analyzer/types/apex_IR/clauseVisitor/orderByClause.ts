import { OrderByClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { FieldOrderListTypeClass, ListVisitor, isFieldOrderListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class OrderByClauseTypeClass extends ClauseTypeClass<
    'orderByClause',
    FieldOrderListTypeClass
> {
    private constructor(value: FieldOrderListTypeClass | ApexErrorTypeClass) {
        super('orderByClause', value);
    }

    static create(ctx: OrderByClauseContext): OrderByClauseTypeClass {
        if (!ctx.fieldOrderList()) {
            throw new Error('値が異常です。OrderByClauseContext: ' + ctx.getText());
        }

        return new OrderByClauseTypeClass(
            visitNode(
                new ListVisitor(),
                ctx.fieldOrderList(),
                isFieldOrderListType,
                'fieldOrderList',
            ),
        );
    }
}

export const isOrderByClauseType = (
    target: ApexCommonTypeClass<string>,
): target is OrderByClauseTypeClass => {
    return target instanceof OrderByClauseTypeClass;
};
