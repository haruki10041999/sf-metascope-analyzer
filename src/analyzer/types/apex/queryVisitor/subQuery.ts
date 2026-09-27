import { SubQueryContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SubQueryType = {
    type: 'subQuery';
    select: Omit<ListType, 'type'>;
    from: Omit<ListType, 'type'>;
    for?: Omit<ClauseType, 'type'>;
    where?: Omit<ClauseType, 'type'>;
    orderBy?: Omit<ClauseType, 'type'>;
    limit?: Omit<ClauseType, 'type'>;
    update?: Omit<ListType, 'type'>;
};

export const makeSubQueryType = (ctx: SubQueryContext): SubQueryType => {
    const { type: _, ...select } = new ListVisitor().visit(ctx.subFieldList());
    const { type: __, ...from } = new ListVisitor().visit(ctx.fromNameList());

    const subQueryType: SubQueryType = {
        type: 'subQuery',
        select: select,
        from: from,
    };

    if (ctx.forClauses()) {
        const { type, ...forClauses } = new ClauseVisitor().visit(ctx.forClauses());
        subQueryType.for = forClauses;
    }

    if (ctx.whereClause()) {
        const { type, ...whereClause } = new ClauseVisitor().visit(ctx.whereClause());
        subQueryType.where = whereClause;
    }

    if (ctx.orderByClause()) {
        const { type, ...orderByClause } = new ClauseVisitor().visit(ctx.orderByClause());
        subQueryType.orderBy = orderByClause;
    }

    if (ctx.limitClause()) {
        const { type, ...limitClause } = new ClauseVisitor().visit(ctx.limitClause());
        subQueryType.limit = limitClause;
    }

    if (ctx.updateList()) {
        const { type, ...updateList } = new ListVisitor().visit(ctx.updateList());
        subQueryType.update = updateList;
    }

    return subQueryType;
};
