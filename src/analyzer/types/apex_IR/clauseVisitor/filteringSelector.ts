import { FilteringSelectorContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

type FilteringSelectorField = 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';

export class FilteringSelectorTypeClass extends ClauseTypeClass<string> {
    private constructor(value: string) {
        super('filteringSelector', value);
    }

    static create(ctx: FilteringSelectorContext): FilteringSelectorTypeClass {
        if (!ctx.AT() && !ctx.ABOVE() && !ctx.BELOW() && !ctx.ABOVE_OR_BELOW()) {
            throw new Error(`値が異常です。FilteringSelectorContext:${ctx.getText()}`);
        }

        let value: string = '';
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

export const isFileteringSelectorType = (
    target: CommonTypeClass,
): target is FilteringSelectorTypeClass => {
    return target instanceof FilteringSelectorTypeClass;
};
