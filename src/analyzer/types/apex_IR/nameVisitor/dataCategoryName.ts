import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { SoqlIdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DataCategoryNameType = TypeField<'dataCategoryName'> & {
    value: SoqlIdTypeClass[];
};

export class DataCategoryNameTypeClass extends ApexCommonTypeClass<
    'dataCategoryName',
    DataCategoryNameType
> {
    private constructor(fields: FieldsOf<DataCategoryNameType>, sourceSpan: SourceSpan) {
        super('dataCategoryName', fields, sourceSpan);
    }

    static create(ctx: DataCategoryNameContext): DataCategoryNameTypeClass {
        return new DataCategoryNameTypeClass(
            {
                value: createNodeList(
                    ctx.soqlId_list(),
                    (c) => SoqlIdTypeClass.create(c),
                    'soqlId',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): DataCategoryNameType['value'] {
        return this.getFields().value;
    }
}

export const isDataCategoryNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DataCategoryNameTypeClass => isSpicifyApexCommonTypeClass('dataCategoryName', target);
