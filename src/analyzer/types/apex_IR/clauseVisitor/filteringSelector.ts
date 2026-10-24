import { FilteringSelectorContext } from '@apexdevtools/apex-parser';

import { ClauseValueTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

type FilteringSelectorField = 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';

export class FilteringSelectorTypeClass extends ClauseValueTypeClass<
    'filteringSelector',
    FilteringSelectorField
> {
    private constructor(value: FilteringSelectorField) {
        super('filteringSelector', value);
    }

    static create(ctx: FilteringSelectorContext): FilteringSelectorTypeClass {
        if (!ctx.AT() && !ctx.ABOVE() && !ctx.BELOW() && !ctx.ABOVE_OR_BELOW()) {
            throw new Error(`値が異常です。FilteringSelectorContext:${ctx.getText()}`);
        }

        let value: FilteringSelectorField;
        if (ctx.AT()) {
            value = 'AT';
        } else if (ctx.ABOVE()) {
            value = 'ABOVE';
        } else if (ctx.BELOW()) {
            value = 'BELOW';
        } else {
            value = 'ABOVE_OR_BELOW';
        }

        return new FilteringSelectorTypeClass(value);
    }
}

export const isFilteringSelectorType = (
    target: CommonTypeClass<string>,
): target is FilteringSelectorTypeClass => {
    return target instanceof FilteringSelectorTypeClass;
};
