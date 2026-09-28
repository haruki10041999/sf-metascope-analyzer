import { OrderByClauseContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';

export type OrderByClauseType = {
    type: 'orderByClause';
    clause: ListType;
};

export const makeOrderByClauseType = (ctx: OrderByClauseContext): OrderByClauseType => {
    const fields = new ListVisitor().visit(ctx.fieldOrderList());

    return {
        type: 'orderByClause',
        clause: fields,
    };
};

