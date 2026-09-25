import { QueryContext } from '@apexdevtools/apex-parser';

import { SelectField, makeSelectList } from './select';
import { FromField, makeFromField } from './from';
import { WhereField, makeWhereField } from './where';
import { OrderByField, makeOrderByList } from './orderBy';
import { LimitField, makeLimitField } from './limit';
import { ForField, makeForField } from './for';
import { UsingScopeField, makeUsingScopeField } from './usingScope';
import { OffsetField, makeOffsetField } from './offset';
import { AllRowsField, makeAllRowsField } from './allRow';
import { UpdateField, makeUpdateField } from './updateVisitor/updateList';

export type QueryField = {
    select: SelectField[];
    from: FromField;
    where?: WhereField;
    orderBy?: OrderByField[];
    limit?: LimitField;
    for?: ForField;
    usingScope?: UsingScopeField;
    offset?: OffsetField;
    allrows?: AllRowsField;
    update?: UpdateField;
};

export const makeQueryField = (ctx: QueryContext): QueryField => {
    const selectFields = makeSelectList(ctx.selectList());
    const fromField = makeFromField(ctx.fromNameList());

    const subQueryField: QueryField = {
        select: selectFields,
        from: fromField,
    };

    if (ctx.whereClause()) {
        subQueryField.where = makeWhereField(ctx.whereClause());
    }

    if (ctx.orderByClause()) {
        subQueryField.orderBy = makeOrderByList(ctx.orderByClause());
    }

    if (ctx.limitClause()) {
        subQueryField.limit = makeLimitField(ctx.limitClause());
    }

    if (ctx.forClauses()) {
        subQueryField.for = makeForField(ctx.forClauses());
    }

    if (ctx.usingScope()) {
        subQueryField.usingScope = makeUsingScopeField(ctx.usingScope());
    }

    if (ctx.offsetClause()) {
        subQueryField.offset = makeOffsetField(ctx.offsetClause());
    }

    if (ctx.allRowsClause()) {
        subQueryField.allrows = makeAllRowsField(ctx.allRowsClause());
    }

    if (ctx.updateList()) {
        subQueryField.update = makeUpdateField(ctx.updateList());
    }

    return subQueryField;
};

