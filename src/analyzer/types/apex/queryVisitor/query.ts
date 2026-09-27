import { QueryContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

import { UsingScopeType, makeUsingScopeType } from '../usingScope';

export type QueryType = {
    type: 'query';
    select: Omit<ListType, 'type'>;
    from: Omit<ListType, 'type'>;
    for?: Omit<ClauseType, 'type'>;
    usingScope?: Omit<UsingScopeType, 'type'>;
    where?: Omit<ClauseType, 'type'>;
    with?: Omit<ClauseType, 'type'>;
    groupBy?: Omit<ClauseType, 'type'>;
    orderBy?: Omit<ClauseType, 'type'>;
    limit?: Omit<ClauseType, 'type'>;
    offset?: Omit<ClauseType, 'type'>;
    allRow?: Omit<ClauseType, 'type'>;
    update?: Omit<ListType, 'type'>;
};

export const makeQueryType = (ctx: QueryContext): QueryType => {
    const { type: _, ...select } = new ListVisitor().visit(ctx.selectList());
    const { type: __, ...from } = new ListVisitor().visit(ctx.fromNameList());

    const queryType: QueryType = {
        type: 'query',
        select: select,
        from: from,
    };

    if (ctx.forClauses()) {
        const { type, ...forClauses } = new ClauseVisitor().visit(ctx.forClauses());
        queryType.for = forClauses;
    }

    if (ctx.usingScope()) {
        const { type, ...usingScope } = makeUsingScopeType(ctx.usingScope());
        queryType.usingScope = usingScope;
    }

    if (ctx.whereClause()) {
        const { type, ...whereClause } = new ClauseVisitor().visit(ctx.whereClause());
        queryType.where = whereClause;
    }

    if (ctx.withClause()) {
        const { type, ...withClause } = new ClauseVisitor().visit(ctx.withClause());
        queryType.with = withClause;
    }

    if (ctx.groupByClause()) {
        const { type, ...groupByClause } = new ClauseVisitor().visit(ctx.groupByClause());
        queryType.groupBy = groupByClause;
    }

    if (ctx.orderByClause()) {
        const { type, ...orderByClause } = new ClauseVisitor().visit(ctx.orderByClause());
        queryType.orderBy = orderByClause;
    }

    if (ctx.limitClause()) {
        const { type, ...limitClause } = new ClauseVisitor().visit(ctx.limitClause());
        queryType.limit = limitClause;
    }

    if (ctx.offsetClause()) {
        const { type, ...offsetClause } = new ClauseVisitor().visit(ctx.offsetClause());
        queryType.offset = offsetClause;
    }

    if (ctx.allRowsClause()) {
        const { type, ...allRowsClause } = new ClauseVisitor().visit(ctx.allRowsClause());
        queryType.allRow = allRowsClause;
    }

    if (ctx.updateList()) {
        const { type, ...updateList } = new ListVisitor().visit(ctx.updateList());
        queryType.update = updateList;
    }

    return queryType;
};
