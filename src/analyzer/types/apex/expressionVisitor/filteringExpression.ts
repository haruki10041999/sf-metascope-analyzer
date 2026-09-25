import { FilteringExpressionContext } from '@apexdevtools/apex-parser';

import { DataCategorySelectionType, makeDataCategorySelectionType } from '../dataCategorySelection';

export type FilteringExpressionType = {
    type: 'filteringExpression';
    value: Omit<DataCategorySelectionType, 'type'>[];
};

export const makeFilteringExpressionType = (
    ctx: FilteringExpressionContext,
): FilteringExpressionType => {
    const andNodesCount = ctx.SOQLAND_list() ? ctx.SOQLAND_list().length : 0;

    if (
        ctx.dataCategorySelection_list() &&
        ctx.dataCategorySelection_list().length > 0 &&
        ctx.dataCategorySelection_list().length - 1 !== andNodesCount
    ) {
        throw new Error('値が異常です。FilteringExpressionContext: ' + ctx.getText());
    }

    const values = ctx.dataCategorySelection_list().map((dataCategorySelectionCtx) => {
        const { type, ...value } = makeDataCategorySelectionType(dataCategorySelectionCtx);
        return value;
    });

    return {
        type: 'filteringExpression',
        value: values,
    };
};
