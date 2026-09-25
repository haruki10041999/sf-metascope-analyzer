import { DataCategorySelectionContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from './idVisitor';
import { NameType, NameVisitor } from './nameVisitor';

import { FilteringSelectorType, makeFilteringSelectorType } from './filteringSelector';

export type DataCategorySelectionType = {
    type: 'dataCategorySelection';
    groupName: Omit<IdType, 'type'>;
    selector: Omit<FilteringSelectorType, 'type'>;
    categoryName: Omit<NameType, 'type'>;
};

export const makeDataCategorySelectionType = (
    ctx: DataCategorySelectionContext,
): DataCategorySelectionType => {
    const { type: _, ...groupName } = new IdVisitor().visit(ctx.soqlId());
    const { type: __, ...selector } = makeFilteringSelectorType(ctx.filteringSelector());
    const { type: ___, ...categoryName } = new NameVisitor().visit(ctx.dataCategoryName());

    return {
        type: 'dataCategorySelection',
        groupName: groupName,
        selector: selector,
        categoryName: categoryName,
    };
};
