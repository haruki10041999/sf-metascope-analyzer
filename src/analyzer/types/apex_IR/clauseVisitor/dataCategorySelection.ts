import { DataCategorySelectionContext } from '@apexdevtools/apex-parser';

import { FilteringSelectorTypeClass } from './filteringSelector';

import { SoqlIdTypeClass } from '../idVisitor';
import { DataCategoryNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DataCategorySelectionType = TypeField<'dataCategorySelection'> & {
    value: SoqlIdTypeClass;
    selector: FilteringSelectorTypeClass;
    category: DataCategoryNameTypeClass;
};

export class DataCategorySelectionTypeClass extends ApexCommonTypeClass<
    'dataCategorySelection',
    DataCategorySelectionType
> {
    private constructor(fields: FieldsOf<DataCategorySelectionType>, sourceSpan: SourceSpan) {
        super('dataCategorySelection', fields, sourceSpan);
    }

    static create(ctx: DataCategorySelectionContext): DataCategorySelectionTypeClass {
        return new DataCategorySelectionTypeClass(
            {
                value: createNode(ctx.soqlId(), (c) => SoqlIdTypeClass.create(c), 'soqlId'),
                selector: createNode(
                    ctx.filteringSelector(),
                    (c) => FilteringSelectorTypeClass.create(c),
                    'filteringSelector',
                ),
                category: createNode(
                    ctx.dataCategoryName(),
                    (c) => DataCategoryNameTypeClass.create(c),
                    'dataCategoryName',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): DataCategorySelectionType['value'] {
        return this.getFields().value;
    }

    getSelector(): DataCategorySelectionType['selector'] {
        return this.getFields().selector;
    }

    getCategory(): DataCategorySelectionType['category'] {
        return this.getFields().category;
    }
}

export const isDataCategorySelectionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DataCategorySelectionTypeClass => {
    return isSpicifyApexCommonTypeClass('dataCategorySelection', target);
};
