import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type DataCategoryNameType = {
    type: 'DataCategoryName';
    name: IdType[];
};

export function makeDataCategoryNameType(ctx: DataCategoryNameContext): DataCategoryNameType {
    const names = ctx.soqlId_list().map((idCtx) => {
        const name = new IdVisitor().visit(idCtx);
        return name;
    });

    return {
        type: 'DataCategoryName',
        name: names,
    };
}
