import { NormalQueryClass } from '../converter';

import { SelectField, makeSelectField } from './select';
import { FromField, makeFromField } from './from';
import { makeForField } from './for';
import { WhereField, makeWhereField } from './where';
import { OrderByField, makeOrderByField } from './orderBy';
import { LimitField, makeLimitField } from './limit';
import { makeUpdateField } from './update';
import { WithField, makewithField } from './with';
import { GroupByField, makeGroupByField } from './groupBy';
import { offsetField, makeOffsetField } from './offset';

export type SoqlType =
    | {
          select: SelectField;
          from: FromField;
          for?: string;
          where?: WhereField;
          orderBy?: OrderByField[];
          limit?: LimitField;
          update?: string[];
          usingScope?: string;
          with?: WithField;
          groupBy?: GroupByField;
          offset?: offsetField;
          allRows?: string;
      }
    | 'Unsupported';

export const makesoqlType = (query: NormalQueryClass): SoqlType => {
    const selectField = makeSelectField(query.getValue());
    const fromField = makeFromField(query.getFrom());

    if (selectField && fromField) {
        const soqlType: SoqlType = {
            select: selectField,
            from: fromField,
        };

        const forField = makeForField(query.getForClause());
        if (forField) {
            soqlType.for = forField;
        }

        const whereField = makeWhereField(query.getWhereClause());
        if (whereField) {
            soqlType.where = whereField;
        }

        const orderByField = makeOrderByField(query.getOrderByClause());
        if (orderByField) {
            soqlType.orderBy = orderByField;
        }

        const limitClause = query.getLimitClause();
        if (limitClause) {
            const limitField = makeLimitField(limitClause);
            if (limitField) {
                soqlType.limit = limitField;
            }
        }

        const updateField = makeUpdateField(query.getUpdateList());
        if (updateField) {
            soqlType.update = updateField;
        }

        const usingScope = query.getUsingScope();
        if (usingScope) {
            soqlType.usingScope = usingScope;
        }

        const withField = makewithField(query.getWithClause());
        if (withField) {
            soqlType.with = withField;
        }

        const groupByField = makeGroupByField(query.getGroupByClause());
        if (groupByField) {
            soqlType.groupBy = groupByField;
        }

        const offsetClause = query.getOffsetClause();
        if (offsetClause) {
            const offsetField = makeOffsetField(offsetClause);
            if (offsetField) {
                soqlType.limit = offsetField;
            }
        }

        const allRows = query.getAllRowsClause();
        if (allRows) {
            soqlType.allRows = allRows;
        }

        return soqlType;
    }

    return 'Unsupported';
};
