import { FieldNameListContext } from '@apexdevtools/apex-parser';

import { FieldNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldNameListType = TypeField<'fieldNameList'> & {
    value: FieldNameTypeClass[];
};

export class FieldNameListTypeClass extends ApexCommonTypeClass<
    'fieldNameList',
    FieldNameListType
> {
    private constructor(fields: FieldsOf<FieldNameListType>, sourceSpan: SourceSpan) {
        super('fieldNameList', fields, sourceSpan);
    }

    static create(ctx: FieldNameListContext): FieldNameListTypeClass {
        return new FieldNameListTypeClass(
            {
                value: createNodeList(
                    ctx.fieldName_list(),
                    (c) => FieldNameTypeClass.create(c),
                    'fieldName',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FieldNameListType['value'] {
        return this.getFields().value;
    }
}

export const isFieldNameListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldNameListTypeClass => isSpicifyApexCommonTypeClass('fieldNameList', target);
