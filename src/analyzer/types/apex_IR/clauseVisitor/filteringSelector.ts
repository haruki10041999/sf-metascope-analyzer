import { FilteringSelectorContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

type FilteringSelectorField = 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';

export type FilteringSelectorType = TypeField<'filteringSelector'> & {
    value: FilteringSelectorField;
};

export class FilteringSelectorTypeClass extends ApexCommonTypeClass<
    'filteringSelector',
    FilteringSelectorType
> {
    private constructor(fields: FieldsOf<FilteringSelectorType>, sourceSpan: SourceSpan) {
        super('filteringSelector', fields, sourceSpan);
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

        return new FilteringSelectorTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): FilteringSelectorType['value'] {
        return this.getFields().value;
    }
}

export const isFilteringSelectorType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FilteringSelectorTypeClass => {
    return isSpicifyApexCommonTypeClass('filteringSelector', target);
};
