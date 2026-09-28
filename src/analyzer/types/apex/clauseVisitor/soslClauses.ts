import { SoslClausesContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '.';

import { ListType, ListVisitor } from '../listVisitor';

import { SearchGroupType, makeSearchGroupType } from '../searchGroup';

export type SoslClausesType = {
    type: 'SoslClauses';
    clause: {
        searchGroup: SearchGroupType;
        fieldSpecList: ListType;
        withList?: ClauseType[];
        limit?: ClauseType;
        updatelist?: ListType;
    };
};

export const makeSoslClausesType = (ctx: SoslClausesContext): SoslClausesType => {
    const searchGroup = makeSearchGroupType(ctx.searchGroup());
    const fieldSpecList = new ListVisitor().visit(ctx.fieldSpecList());

    const soslClausesType: SoslClausesType = {
        type: 'SoslClauses',
        clause: {
            searchGroup: searchGroup,
            fieldSpecList: fieldSpecList,
        },
    };

    if (ctx.soslWithClause_list() && ctx.soslWithClause_list().length > 0) {
        const withList = ctx.soslWithClause_list().map((soslWithClauseCtx) => {
            const withClause = new ClauseVisitor().visit(soslWithClauseCtx);
            return withClause;
        });

        soslClausesType.clause.withList = withList;
    }

    if (ctx.limitClause()) {
        const limit = new ClauseVisitor().visit(ctx.limitClause());
        soslClausesType.clause.limit = limit;
    }

    if (ctx.UPDATE() && ctx.updateList()) {
        const updateList = new ListVisitor().visit(ctx.updateList());
        soslClausesType.clause.updatelist = updateList;
    }

    return soslClausesType;
};

