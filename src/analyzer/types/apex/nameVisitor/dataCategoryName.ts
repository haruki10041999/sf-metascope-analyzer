import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type DataCategoryNameType = {
    type: 'DataCategoryName';
    name: Omit<IdType, 'type'>[];
};

export function makeDataCategoryNameType(ctx: DataCategoryNameContext): DataCategoryNameType {
    const names = ctx.soqlId_list().map((idCtx) => {
        const { type, ...name } = new IdVisitor().visit(idCtx);
        return name;
    });

    return {
        type: 'DataCategoryName',
        name: names,
    };
}
