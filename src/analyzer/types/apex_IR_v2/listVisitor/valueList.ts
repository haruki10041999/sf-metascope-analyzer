import { ValueListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { NormalValueTypeClass, ValueVisitor, isNormalValueType } from '../valueVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class ValueListTypeClass extends ListTypeClass<'valueList', NormalValueTypeClass> {
    private constructor(value: (NormalValueTypeClass | ApexErrorTypeClass)[]) {
        super('valueList', value);
    }

    static create(ctx: ValueListContext): ValueListTypeClass {
        if (!ctx.value_list() || ctx.value_list().length === 0) {
            throw new Error('値が異常です。ValueListContext: ' + ctx.getText());
        }

        return new ValueListTypeClass(
            visitNodeList(new ValueVisitor(), ctx.value_list(), isNormalValueType, 'value'),
        );
    }
}

export const isValueListType = (
    target: ApexCommonTypeClass<string>,
): target is ValueListTypeClass => {
    return target instanceof ValueListTypeClass;
};
