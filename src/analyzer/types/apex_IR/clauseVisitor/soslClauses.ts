import { SoslClausesContext } from '@apexdevtools/apex-parser';

import {
    SoslWithClauseTypeClass,
    LimitClauseTypeClass,
    ClauseTypeClass,
    ClauseVisitor,
    isSoslWithClauseType,
    isLimitClauseType,
} from '.';

import {
    FieldSpecListTypeClass,
    UpdateListTypeClass,
    ListVisitor,
    isFieldSpecListType,
    isUpdateListType,
} from '../listVisitor';
import { SearchGroupTypeClass, QueryVisitor, isSearchGroupType } from '../queryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class SoslClausesTypeClass extends ClauseTypeClass<SearchGroupTypeClass | null> {
    private fieldSpecList: FieldSpecListTypeClass | ErrorTypeClass | null;
    private withList: (SoslWithClauseTypeClass | ErrorTypeClass)[] | null;
    private limitClause: LimitClauseTypeClass | ErrorTypeClass | null;
    private updateList: UpdateListTypeClass | ErrorTypeClass | null;

    private constructor(
        value: SearchGroupTypeClass | ErrorTypeClass | null,
        fieldSpecList: FieldSpecListTypeClass | ErrorTypeClass | null,
        withList: (SoslWithClauseTypeClass | ErrorTypeClass)[] | null,
        limitClause: LimitClauseTypeClass | ErrorTypeClass | null,
        updateList: UpdateListTypeClass | ErrorTypeClass | null,
    ) {
        super('soslClauses', value);
        this.fieldSpecList = fieldSpecList;
        this.withList = withList;
        this.limitClause = limitClause;
        this.updateList = updateList;
    }

    static create(ctx: SoslClausesContext): SoslClausesTypeClass {
        // `IN ... FIELDS` / `RETURNING ...` はいずれも任意
        return new SoslClausesTypeClass(
            ctx.searchGroup()
                ? isValidClass(
                      new QueryVisitor().visit(ctx.searchGroup()),
                      isSearchGroupType,
                      'searchGroup',
                  )
                : null,
            ctx.fieldSpecList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.fieldSpecList()),
                      isFieldSpecListType,
                      'fieldSpecList',
                  )
                : null,
            ctx.soslWithClause_list() && ctx.soslWithClause_list().length > 0
                ? isValidClassList(
                      ctx.soslWithClause_list(),
                      (ctx) => new ClauseVisitor().visit(ctx),
                      isSoslWithClauseType,
                      'soslWithClause',
                  )
                : null,
            ctx.limitClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.limitClause()),
                      isLimitClauseType,
                      'limitClause',
                  )
                : null,
            ctx.UPDATE() && ctx.updateList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.updateList()),
                      isUpdateListType,
                      'updateList',
                  )
                : null,
        );
    }

    getFieldSpecList(): FieldSpecListTypeClass | ErrorTypeClass | null {
        return this.fieldSpecList;
    }

    getWithList(): (SoslWithClauseTypeClass | ErrorTypeClass)[] | null {
        return this.withList;
    }

    getLimitClause(): LimitClauseTypeClass | ErrorTypeClass | null {
        return this.limitClause;
    }

    getUpdateList(): UpdateListTypeClass | ErrorTypeClass | null {
        return this.updateList;
    }
}

export const isSoslClausesType = (target: CommonTypeClass): target is SoslClausesTypeClass => {
    return target instanceof SoslClausesTypeClass;
};

