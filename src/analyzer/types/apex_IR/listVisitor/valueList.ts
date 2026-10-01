import { ValueListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { NormalValueTypeClass, ValueVisitor, isNormalValueType } from '../valueVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ValueListTypeClass extends ListTypeClass<NormalValueTypeClass[]> {
    private constructor(
        value: NormalValueTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('valueList', value, errorClasses);
    }

    static create(ctx: ValueListContext): ValueListTypeClass {
        if (!ctx.value_list() || ctx.value_list().length === 0) {
            throw new Error('値が異常です。ValueListContext: ' + ctx.getText());
        }

        const value: NormalValueTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.value_list().forEach((valueCtx, index) => {
            const valueTypeClass = new ValueVisitor().visit(valueCtx);
            if (isNormalValueType(valueTypeClass)) {
                value.push(valueTypeClass);
            } else if (isErrorType(valueTypeClass)) {
                errorClasses[`value_${index}`] = valueTypeClass;
            }
        });

        return new ValueListTypeClass(value, errorClasses);
    }
}

export const isValueListType = (target: CommonTypeClass): target is ValueListTypeClass => {
    return target instanceof ValueListTypeClass;
};

