import { FilteringExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionListBaseTypeClass } from '.';

import {
    DataCategorySelectionTypeClass,
    ClauseVisitor,
    isDataCategorySelectionType,
} from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class FilteringExpressionTypeClass extends ExpressionListBaseTypeClass<
    'filteringExpression',
    DataCategorySelectionTypeClass
> {
    private constructor(value: (DataCategorySelectionTypeClass | ApexErrorTypeClass)[]) {
        super('filteringExpression', value);
    }

    static create(ctx: FilteringExpressionContext): FilteringExpressionTypeClass {
        if (
            ctx.dataCategorySelection_list() &&
            ctx.dataCategorySelection_list().length > 0 &&
            ctx.dataCategorySelection_list().length - 1 !== (ctx.SOQLAND_list()?.length || 0)
        ) {
            throw new Error('値が異常です。FilteringExpressionContext: ' + ctx.getText());
        }

        return new FilteringExpressionTypeClass(
            visitNodeList(
                new ClauseVisitor(),
                ctx.dataCategorySelection_list(),
                isDataCategorySelectionType,
                'dataCategorySelection',
            ),
        );
    }
}

export const isFilteringExpressionType = (
    target: ApexCommonTypeClass<string>,
): target is FilteringExpressionTypeClass => {
    return target instanceof FilteringExpressionTypeClass;
};
