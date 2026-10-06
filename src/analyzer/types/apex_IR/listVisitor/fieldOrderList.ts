import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldOrderTypeClass, ClauseVisitor, isFieldOrderType } from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class FieldOrderListTypeClass extends ListTypeClass<FieldOrderTypeClass> {
    private constructor(value: (FieldOrderTypeClass | ErrorTypeClass)[]) {
        super('fieldOrderList', value);
    }

    static create(ctx: FieldOrderListContext): FieldOrderListTypeClass {
        if (!ctx.fieldOrder_list() || ctx.fieldOrder_list().length === 0) {
            throw new Error('値が異常です。FieldOrderListContext: ' + ctx.getText());
        }

        return new FieldOrderListTypeClass(
            isValidClassList(
                ctx.fieldOrder_list(),
                (ctx) => new ClauseVisitor().visit(ctx),
                isFieldOrderType,
                'fieldOrder',
            ),
        );
    }
}

export const isFieldOrderListType = (
    target: CommonTypeClass,
): target is FieldOrderListTypeClass => {
    return target instanceof FieldOrderListTypeClass;
};
