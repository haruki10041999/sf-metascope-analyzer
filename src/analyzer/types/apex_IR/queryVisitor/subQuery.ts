import { SubQueryContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '../listVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SubQueryType = {
    type: 'subQuery';
    query: {
        select: ListType;
        from: ListType;
        for?: ClauseType;
        where?: ClauseType;
        orderBy?: ClauseType;
        limit?: ClauseType;
        update?: ListType;
    };
};

export const makeSubQueryType = (ctx: SubQueryContext): SubQueryType => {
    if (!ctx.subFieldList() || !ctx.fromNameList()) {
        throw new Error('値が異常です。SubQueryContext: ' + ctx.getText());
    }

    const select = new ListVisitor().visit(ctx.subFieldList());
    const from = new ListVisitor().visit(ctx.fromNameList());

    const subQueryType: SubQueryType = {
        type: 'subQuery',
        query: {
            select: select,
            from: from,
        },
    };

    if (ctx.forClauses()) {
        const forClauses = new ClauseVisitor().visit(ctx.forClauses());
        subQueryType.query.for = forClauses;
    }

    if (ctx.whereClause()) {
        const whereClause = new ClauseVisitor().visit(ctx.whereClause());
        subQueryType.query.where = whereClause;
    }

    if (ctx.orderByClause()) {
        const orderByClause = new ClauseVisitor().visit(ctx.orderByClause());
        subQueryType.query.orderBy = orderByClause;
    }

    if (ctx.limitClause()) {
        const limitClause = new ClauseVisitor().visit(ctx.limitClause());
        subQueryType.query.limit = limitClause;
    }

    if (ctx.updateList()) {
        const updateList = new ListVisitor().visit(ctx.updateList());
        subQueryType.query.update = updateList;
    }

    return subQueryType;
};

