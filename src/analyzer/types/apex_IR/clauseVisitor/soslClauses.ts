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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export class SoslClausesTypeClass extends ClauseTypeClass<
    'soslClauses',
    SearchGroupTypeClass | null
> {
    private fieldSpecList: FieldSpecListTypeClass | ApexErrorTypeClass | null;
    private withList: (SoslWithClauseTypeClass | ApexErrorTypeClass)[] | null;
    private limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null;
    private updateList: UpdateListTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: SearchGroupTypeClass | ApexErrorTypeClass | null,
        fieldSpecList: FieldSpecListTypeClass | ApexErrorTypeClass | null,
        withList: (SoslWithClauseTypeClass | ApexErrorTypeClass)[] | null,
        limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null,
        updateList: UpdateListTypeClass | ApexErrorTypeClass | null,
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
                ? isApexValidClass(
                      new QueryVisitor().visit(ctx.searchGroup()),
                      isSearchGroupType,
                      'searchGroup',
                  )
                : null,
            ctx.fieldSpecList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.fieldSpecList()),
                      isFieldSpecListType,
                      'fieldSpecList',
                  )
                : null,
            ctx.soslWithClause_list() && ctx.soslWithClause_list().length > 0
                ? isApexValidClassList(
                      ctx.soslWithClause_list(),
                      (ctx) => new ClauseVisitor().visit(ctx),
                      isSoslWithClauseType,
                      'soslWithClause',
                  )
                : null,
            ctx.limitClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.limitClause()),
                      isLimitClauseType,
                      'limitClause',
                  )
                : null,
            ctx.UPDATE() && ctx.updateList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.updateList()),
                      isUpdateListType,
                      'updateList',
                  )
                : null,
        );
    }

    getFieldSpecList(): FieldSpecListTypeClass | ApexErrorTypeClass | null {
        return this.fieldSpecList;
    }

    getWithList(): (SoslWithClauseTypeClass | ApexErrorTypeClass)[] | null {
        return this.withList;
    }

    getLimitClause(): LimitClauseTypeClass | ApexErrorTypeClass | null {
        return this.limitClause;
    }

    getUpdateList(): UpdateListTypeClass | ApexErrorTypeClass | null {
        return this.updateList;
    }
}

export const isSoslClausesType = (
    target: ApexCommonTypeClass<string>,
): target is SoslClausesTypeClass => {
    return target instanceof SoslClausesTypeClass;
};

