import { QueryContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from '.';

import { QueryType } from './normal';

import { ListType, ListVisitor } from '../listVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';
import { SoqlIdTypeClass, IdVisitor } from '../idVisitor';
import { CommonTypeClass, ErrorTypeClass } from '../commonVisitor';

export class NormalQueryTypeClass extends QueryTypeClass<SoqlIdTypeClass> {}

export const isNormalQueryType = (target: CommonTypeClass): target is NormalQueryTypeClass => {
    return target instanceof NormalQueryTypeClass;
};

export type QueryType = {
    type: 'query';
    query: {
        select: ListType;
        from: ListType;
        for?: ClauseType;
        usingScope?: ClauseType;
        where?: ClauseType;
        with?: ClauseType;
        groupBy?: ClauseType;
        orderBy?: ClauseType;
        limit?: ClauseType;
        offset?: ClauseType;
        allRow?: ClauseType;
        update?: ListType;
    };
};

export const makeQueryType = (ctx: QueryContext): QueryType => {
    if (!ctx.selectList() || !ctx.fromNameList()) {
        throw new Error('値が異常です。QueryContext: ' + ctx.getText());
    }

    const select = new ListVisitor().visit(ctx.selectList());
    const from = new ListVisitor().visit(ctx.fromNameList());

    const queryType: QueryType = {
        type: 'query',
        query: {
            select: select,
            from: from,
        },
    };

    if (ctx.forClauses()) {
        const forClauses = new ClauseVisitor().visit(ctx.forClauses());
        queryType.query.for = forClauses;
    }

    if (ctx.usingScope()) {
        const usingScope = new ClauseVisitor().visit(ctx.usingScope());
        queryType.query.usingScope = usingScope;
    }

    if (ctx.whereClause()) {
        const whereClause = new ClauseVisitor().visit(ctx.whereClause());
        queryType.query.where = whereClause;
    }

    if (ctx.withClause()) {
        const withClause = new ClauseVisitor().visit(ctx.withClause());
        queryType.query.with = withClause;
    }

    if (ctx.groupByClause()) {
        const groupByClause = new ClauseVisitor().visit(ctx.groupByClause());
        queryType.query.groupBy = groupByClause;
    }

    if (ctx.orderByClause()) {
        const orderByClause = new ClauseVisitor().visit(ctx.orderByClause());
        queryType.query.orderBy = orderByClause;
    }

    if (ctx.limitClause()) {
        const limitClause = new ClauseVisitor().visit(ctx.limitClause());
        queryType.query.limit = limitClause;
    }

    if (ctx.offsetClause()) {
        const offsetClause = new ClauseVisitor().visit(ctx.offsetClause());
        queryType.query.offset = offsetClause;
    }

    if (ctx.allRowsClause()) {
        const allRowsClause = new ClauseVisitor().visit(ctx.allRowsClause());
        queryType.query.allRow = allRowsClause;
    }

    if (ctx.updateList()) {
        const updateList = new ListVisitor().visit(ctx.updateList());
        queryType.query.update = updateList;
    }

    return queryType;
};
