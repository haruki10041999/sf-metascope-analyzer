import { FieldOrderListContext } from '@apexdevtools/apex-parser';

import { FieldOrderTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldOrderListType = TypeField<'fieldOrderList'> & {
    value: FieldOrderTypeClass[];
};

export class FieldOrderListTypeClass extends ApexCommonTypeClass<
    'fieldOrderList',
    FieldOrderListType
> {
    private constructor(fields: FieldsOf<FieldOrderListType>, sourceSpan: SourceSpan) {
        super('fieldOrderList', fields, sourceSpan);
    }

    static create(ctx: FieldOrderListContext): FieldOrderListTypeClass {
        return new FieldOrderListTypeClass(
            {
                value: createNodeList(
                    ctx.fieldOrder_list(),
                    (c) => FieldOrderTypeClass.create(c),
                    'fieldOrder',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FieldOrderListType['value'] {
        return this.getFields().value;
    }
}

export const isFieldOrderListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldOrderListTypeClass => isSpicifyApexCommonTypeClass('fieldOrderList', target);
