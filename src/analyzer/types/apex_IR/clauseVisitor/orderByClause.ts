import { OrderByClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { FieldOrderListTypeClass, ListVisitor, isFieldOrderListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class OrderByClauseTypeClass extends ClauseTypeClass<FieldOrderListTypeClass> {
    private constructor(value: FieldOrderListTypeClass | ErrorTypeClass) {
        super('orderByClause', value);
    }

    static create(ctx: OrderByClauseContext): OrderByClauseTypeClass {
        if (!ctx.fieldOrderList()) {
            throw new Error('値が異常です。OrderByClauseContext: ' + ctx.getText());
        }

        return new OrderByClauseTypeClass(
            isValidClass(
                new ListVisitor().visit(ctx.fieldOrderList()),
                isFieldOrderListType,
                'fieldOrderList',
            ),
        );
    }
}

export const isOrderByClauseType = (target: CommonTypeClass): target is OrderByClauseTypeClass => {
    return target instanceof OrderByClauseTypeClass;
};
