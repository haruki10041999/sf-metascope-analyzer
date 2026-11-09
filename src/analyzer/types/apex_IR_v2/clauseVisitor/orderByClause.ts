import { OrderByClauseContext } from '@apexdevtools/apex-parser';

import { FieldOrderListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type OrderByClauseType = TypeField<'orderByClause'> & {
    value: FieldOrderListTypeClass;
};

export class OrderByClauseTypeClass extends ApexCommonTypeClass<
    'orderByClause',
    OrderByClauseType
> {
    private constructor(fields: FieldsOf<OrderByClauseType>, sourceSpan: SourceSpan) {
        super('orderByClause', fields, sourceSpan);
    }

    static create(ctx: OrderByClauseContext): OrderByClauseTypeClass {
        return new OrderByClauseTypeClass(
            {
                value: createNode(
                    ctx.fieldOrderList(),
                    (c) => FieldOrderListTypeClass.create(c),
                    'fieldOrderList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): OrderByClauseType['value'] {
        return this.getFields().value;
    }
}

export const isOrderByClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is OrderByClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('orderByClause', target);
};
