import { SubQueryContext } from '@apexdevtools/apex-parser';

import { makeSelectList_SubQuery } from './select';

import { SelectField } from '../select';
import { FromField, makeFromField } from '../from';
import { WhereField, makeWhereField } from '../where';
import { OrderByField, makeOrderByList } from '../orderBy';
import { LimitField, makeLimitField } from '../limit';
import { ForField, makeForField } from '../for';
import { UpdateField, makeUpdateField } from '../update';

export type SubQueryField = {
    select: SelectField[];
    from: FromField;
    where?: WhereField;
    orderBy?: OrderByField[];
    limit?: LimitField;
    for?: ForField;
    update?: UpdateField;
};

export const makeSubQueryField = (ctx: SubQueryContext): SubQueryField => {
    const selectFields = makeSelectList_SubQuery(ctx.subFieldList());
    const fromField = makeFromField(ctx.fromNameList());

    const subQueryField: SubQueryField = {
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

    if (ctx.updateList()) {
        subQueryField.update = makeUpdateField(ctx.updateList());
    }

    return subQueryField;
};
