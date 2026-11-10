import { FieldGroupByListContext } from '@apexdevtools/apex-parser';

import { FieldGroupByTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldGroupByListType = TypeField<'fieldGroupByList'> & {
    value: FieldGroupByTypeClass[];
};

export class FieldGroupByListTypeClass extends ApexCommonTypeClass<
    'fieldGroupByList',
    FieldGroupByListType
> {
    private constructor(fields: FieldsOf<FieldGroupByListType>, sourceSpan: SourceSpan) {
        super('fieldGroupByList', fields, sourceSpan);
    }

    static create(ctx: FieldGroupByListContext): FieldGroupByListTypeClass {
        return new FieldGroupByListTypeClass(
            {
                value: createNodeList(
                    ctx.fieldGroupBy_list(),
                    (c) => FieldGroupByTypeClass.create(c),
                    'fieldGroupBy',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FieldGroupByListType['value'] {
        return this.getFields().value;
    }
}

export const isFieldGroupByListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldGroupByListTypeClass => isSpicifyApexCommonTypeClass('fieldGroupByList', target);
