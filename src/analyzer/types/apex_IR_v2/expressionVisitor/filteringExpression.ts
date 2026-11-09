import { FilteringExpressionContext } from '@apexdevtools/apex-parser';

import { DataCategorySelectionTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

/** SOQL の WITH DATA CATEGORY の条件 (dataCategorySelection を AND でつないだもの) */
export type FilteringExpressionType = TypeField<'filteringExpression'> & {
    value: DataCategorySelectionTypeClass[];
};

export class FilteringExpressionTypeClass extends ApexCommonTypeClass<
    'filteringExpression',
    FilteringExpressionType
> {
    private constructor(fields: FieldsOf<FilteringExpressionType>, sourceSpan: SourceSpan) {
        super('filteringExpression', fields, sourceSpan);
    }

    static create(ctx: FilteringExpressionContext): FilteringExpressionTypeClass {
        return new FilteringExpressionTypeClass(
            {
                value: createNodeList(
                    ctx.dataCategorySelection_list(),
                    (c) => DataCategorySelectionTypeClass.create(c),
                    'dataCategorySelection',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): FilteringExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isFilteringExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FilteringExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('filteringExpression', target);
