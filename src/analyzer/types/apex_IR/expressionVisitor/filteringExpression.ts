import { FilteringExpressionContext } from '@apexdevtools/apex-parser';

import { ExpressionListBaseTypeClass } from '.';

import {
    DataCategorySelectionTypeClass,
    ClauseVisitor,
    isDataCategorySelectionType,
} from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class FilteringExpressionTypeClass extends ExpressionListBaseTypeClass<DataCategorySelectionTypeClass> {
    private constructor(value: (DataCategorySelectionTypeClass | ErrorTypeClass)[]) {
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
            isValidClassList(
                ctx.dataCategorySelection_list(),
                (ctx) => new ClauseVisitor().visit(ctx),
                isDataCategorySelectionType,
                'dataCategorySelection',
            ),
        );
    }
}

export const isFilteringExpressionType = (
    target: CommonTypeClass,
): target is FilteringExpressionTypeClass => {
    return target instanceof FilteringExpressionTypeClass;
};

