import { SubQueryClass } from '../converter';

import { SelectField, makeSelectField } from './select';
import { FromField, makeFromField } from './from';
import { makeForField } from './for';
import { WhereField, makeWhereField } from './where';
import { OrderByField, makeOrderByField } from './orderBy';
import { LimitField, makeLimitField } from './limit';
import { makeUpdateField } from './update';

export type SubQueryField = {
    select: SelectField;
    from: FromField;
    for?: string;
    where?: WhereField;
    orderBy?: OrderByField[];
    limit?: LimitField;
    update?: string[];
};

export const makeSubQueryField = (subQuery: SubQueryClass): SubQueryField | undefined => {
    const selectField = makeSelectField(subQuery.getValue());
    const fromField = makeFromField(subQuery.getFrom());

    if (selectField && fromField) {
        const subQueryField: SubQueryField = {
            select: selectField,
            from: fromField,
        };

        const forField = makeForField(subQuery.getForClause());
        if (forField) {
            subQueryField.for = forField;
        }

        const whereField = makeWhereField(subQuery.getWhereClause());
        if (whereField) {
            subQueryField.where = whereField;
        }

        const orderByField = makeOrderByField(subQuery.getOrderByClause());
        if (orderByField) {
            subQueryField.orderBy = orderByField;
        }

        const limitClause = subQuery.getLimitClause();
        if (limitClause) {
            const limitField = makeLimitField(limitClause);
            if (limitField) {
                subQueryField.limit = limitField;
            }
        }

        const updateField = makeUpdateField(subQuery.getUpdateList());
        if (updateField) {
            subQueryField.update = updateField;
        }

        return subQueryField;
    }

    return undefined;
};
