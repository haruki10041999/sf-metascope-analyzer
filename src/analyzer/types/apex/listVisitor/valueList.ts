import { ValueListContext } from '@apexdevtools/apex-parser';

import { ValueType, ValueVisitor } from '../valueVisitor';

export type ValueListType = {
    type: 'valueList';
    list: Omit<ValueType, 'type'>[];
};

export const makeValueListType = (ctx: ValueListContext): ValueListType => {
    const list = ctx.value_list().map((valueCtx) => {
        const { type, ...value } = new ValueVisitor().visit(valueCtx);
        return value;
    });

    return {
        type: 'valueList',
        list: list,
    };
};
