import { ValueListContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '../valueVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ValueListType = TypeField<'valueList'> & {
    value: ValueTypeClass[];
};

export class ValueListTypeClass extends ApexCommonTypeClass<'valueList', ValueListType> {
    private constructor(fields: FieldsOf<ValueListType>, sourceSpan: SourceSpan) {
        super('valueList', fields, sourceSpan);
    }

    static create(ctx: ValueListContext): ValueListTypeClass {
        return new ValueListTypeClass(
            {
                value: createNodeList(ctx.value_list(), (c) => ValueTypeClass.create(c), 'value'),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ValueListType['value'] {
        return this.getFields().value;
    }
}

export const isValueListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ValueListTypeClass => isSpicifyApexCommonTypeClass('valueList', target);
