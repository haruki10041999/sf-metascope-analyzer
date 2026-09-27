import { SoslClausesContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '.';

import { ListType, ListVisitor } from '../listVisitor';

import { SearchGroupType, makeSearchGroupType } from '../searchGroup';

export type SoslClausesType = {
    type: 'SoslClauses';
    searchGroup: Omit<SearchGroupType, 'type'>;
    fieldSpecList: Omit<ListType, 'type'>;
    withList?: Omit<ClauseType, 'type'>[];
    limit?: Omit<ClauseType, 'type'>;
    updatelist?: Omit<ListType, 'type'>;
};

export const makeSoslClausesType = (ctx: SoslClausesContext): SoslClausesType => {
    const { type: _, ...searchGroup } = makeSearchGroupType(ctx.searchGroup());
    const { type: __, ...fieldSpecList } = new ListVisitor().visit(ctx.fieldSpecList());

    const soslClausesType: SoslClausesType = {
        type: 'SoslClauses',
        searchGroup: searchGroup,
        fieldSpecList: fieldSpecList,
    };

    if (ctx.soslWithClause_list() && ctx.soslWithClause_list().length > 0) {
        const withList = ctx.soslWithClause_list().map((soslWithClauseCtx) => {
            const { type: __, ...withClause } = new ClauseVisitor().visit(soslWithClauseCtx);
            return withClause;
        });

        soslClausesType.withList = withList;
    }

    if (ctx.limitClause()) {
        const { type: __, ...limit } = new ClauseVisitor().visit(ctx.limitClause());
        soslClausesType.limit = limit;
    }

    if (ctx.UPDATE() && ctx.updateList()) {
        const { type: __, ...updateList } = new ListVisitor().visit(ctx.updateList());
        soslClausesType.updatelist = updateList;
    }

    return soslClausesType;
};
