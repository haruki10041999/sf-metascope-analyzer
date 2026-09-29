import { DataCategorySelectionContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '.';

import { IdType, IdVisitor } from '../idVisitor';
import { NameType, NameVisitor } from '../nameVisitor';

export type DataCategorySelectionType = {
    type: 'dataCategorySelection';
    clause: {
        group: IdType;
        selector: ClauseType;
        category: NameType;
    };
};

export const makeDataCategorySelectionType = (
    ctx: DataCategorySelectionContext,
): DataCategorySelectionType => {
    if (!ctx.soqlId() || !ctx.filteringSelector() || !ctx.dataCategoryName()) {
        throw new Error('値が異常です。DataCategorySelectionContext: ' + ctx.getText());
    }

    const groupName = new IdVisitor().visit(ctx.soqlId());
    const selector = new ClauseVisitor().visit(ctx.filteringSelector());
    const category = new NameVisitor().visit(ctx.dataCategoryName());

    return {
        type: 'dataCategorySelection',
        clause: {
            group: groupName,
            selector: selector,
            category: category,
        },
    };
};

