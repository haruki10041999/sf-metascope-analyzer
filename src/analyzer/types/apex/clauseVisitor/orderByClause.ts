import { OrderByClauseContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type OrderByClauseType = {
    type: 'orderByClause';
    fields: Omit<ListType, 'type'>;
};

export const makeOrderByClauseType = (ctx: OrderByClauseContext): OrderByClauseType => {
    const { type, ...fields } = new ListVisitor().visit(ctx.fieldOrderList());

    return {
        type: 'orderByClause',
        fields: fields,
    };
};
