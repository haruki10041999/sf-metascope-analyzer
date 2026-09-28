import { FilteringExpressionContext } from '@apexdevtools/apex-parser';

import { DataCategorySelectionType, makeDataCategorySelectionType } from '../dataCategorySelection';

type FilteringFieldType =
    | {
          condition: DataCategorySelectionType;
      }
    | {
          type: 'AND';
          condition1: FilteringFieldType;
          condition2: FilteringFieldType;
      };

export type FilteringExpressionType = {
    type: 'filteringExpression';
    expression: FilteringFieldType;
};

export const makeFilteringExpressionType = (
    ctx: FilteringExpressionContext,
): FilteringExpressionType => {
    const andNodes = ctx.SOQLAND_list() ? ctx.SOQLAND_list() : [];

    if (
        ctx.dataCategorySelection_list() &&
        ctx.dataCategorySelection_list().length > 0 &&
        ctx.dataCategorySelection_list().length - 1 !== andNodes.length
    ) {
        throw new Error('値が異常です。FilteringExpressionContext: ' + ctx.getText());
    }

    const values = ctx.dataCategorySelection_list().map((dataCategorySelectionCtx) => {
        const value = makeDataCategorySelectionType(dataCategorySelectionCtx);
        return value;
    });

    let expression: FilteringFieldType = {
        condition: values.at(0)!,
    };

    for (let i = 0; i < andNodes.length; i++) {
        expression = {
            type: 'AND',
            condition1: expression,
            condition2: {
                condition: values.at(i + 1)!,
            },
        };
    }

    return {
        type: 'filteringExpression',
        expression: expression,
    };
};

