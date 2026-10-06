import { DataCategorySelectionContext } from '@apexdevtools/apex-parser';

import {
    FilteringSelectorTypeClass,
    ClauseTypeClass,
    ClauseVisitor,
    isFileteringSelectorType,
} from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { DataCategoryNameTypeClass, NameVisitor, isDataCategoryNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DataCategorySelectionTypeClass extends ClauseTypeClass<SoqlIdTypeClass> {
    private selector: FilteringSelectorTypeClass | ErrorTypeClass;
    private category: DataCategoryNameTypeClass | ErrorTypeClass;

    private constructor(
        value: SoqlIdTypeClass | ErrorTypeClass,
        selector: FilteringSelectorTypeClass | ErrorTypeClass,
        category: DataCategoryNameTypeClass | ErrorTypeClass,
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
            isValidClass(new IdVisitor().visit(ctx.soqlId()), isSoqlIdType, 'soqlId'),
            isValidClass(
                new ClauseVisitor().visit(ctx.filteringSelector()),
                isFileteringSelectorType,
                'filteringSelector',
            ),
            isValidClass(
                new NameVisitor().visit(ctx.dataCategoryName()),
                isDataCategoryNameType,
                'dataCategoryName',
            ),
        );
    }

    getSelector(): FilteringSelectorTypeClass | ErrorTypeClass {
        return this.selector;
    }

    getCategory(): DataCategoryNameTypeClass | ErrorTypeClass {
        return this.category;
    }
}

export const isDataCategorySelectionType = (
    target: CommonTypeClass,
): target is DataCategorySelectionTypeClass => {
    return target instanceof DataCategorySelectionTypeClass;
};
