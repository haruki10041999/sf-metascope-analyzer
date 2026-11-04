import { DataCategorySelectionContext } from '@apexdevtools/apex-parser';

import {
    FilteringSelectorTypeClass,
    ClauseTypeClass,
    ClauseVisitor,
    isFilteringSelectorType,
} from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { DataCategoryNameTypeClass, NameVisitor, isDataCategoryNameType } from '../nameVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class DataCategorySelectionTypeClass extends ClauseTypeClass<
    'dataCategorySelection',
    SoqlIdTypeClass
> {
    private selector: FilteringSelectorTypeClass | ApexErrorTypeClass;
    private category: DataCategoryNameTypeClass | ApexErrorTypeClass;

    private constructor(
        value: SoqlIdTypeClass | ApexErrorTypeClass,
        selector: FilteringSelectorTypeClass | ApexErrorTypeClass,
        category: DataCategoryNameTypeClass | ApexErrorTypeClass,
    ) {
        super('dataCategorySelection', value);
        this.selector = selector;
        this.category = category;
    }

    static create(ctx: DataCategorySelectionContext): DataCategorySelectionTypeClass {
        if (!ctx.soqlId() || !ctx.filteringSelector() || !ctx.dataCategoryName()) {
            throw new Error('値が異常です。DataCategorySelectionContext: ' + ctx.getText());
        }

        return new DataCategorySelectionTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.soqlId()), isSoqlIdType, 'soqlId'),
            isApexValidClass(
                new ClauseVisitor().visit(ctx.filteringSelector()),
                isFilteringSelectorType,
                'filteringSelector',
            ),
            isApexValidClass(
                new NameVisitor().visit(ctx.dataCategoryName()),
                isDataCategoryNameType,
                'dataCategoryName',
            ),
        );
    }

    getSelector(): FilteringSelectorTypeClass | ApexErrorTypeClass {
        return this.selector;
    }

    getCategory(): DataCategoryNameTypeClass | ApexErrorTypeClass {
        return this.category;
    }
}

export const isDataCategorySelectionType = (
    target: ApexCommonTypeClass<string>,
): target is DataCategorySelectionTypeClass => {
    return target instanceof DataCategorySelectionTypeClass;
};

