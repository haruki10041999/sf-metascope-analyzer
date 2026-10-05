import { ValueListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { NormalValueTypeClass, ValueVisitor, isNormalValueType } from '../valueVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ValueListTypeClass extends ListTypeClass<NormalValueTypeClass> {
    private constructor(value: (NormalValueTypeClass | ErrorTypeClass)[]) {
        super('valueList', value);
    }

    static create(ctx: ValueListContext): ValueListTypeClass {
        if (!ctx.value_list() || ctx.value_list().length === 0) {
            throw new Error('値が異常です。ValueListContext: ' + ctx.getText());
        }

        return new ValueListTypeClass(
            isValidClassList(
                ctx.value_list(),
                (ctx) => new ValueVisitor().visit(ctx),
                isNormalValueType,
                'value',
            ),
        );
    }
}

export const isValueListType = (target: CommonTypeClass): target is ValueListTypeClass => {
    return target instanceof ValueListTypeClass;
};
