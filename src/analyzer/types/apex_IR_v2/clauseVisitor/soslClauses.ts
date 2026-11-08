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
    visitNodeList,
    visitOptionalNode,
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
            visitOptionalNode(
                new QueryVisitor(),
                ctx.searchGroup(),
                isSearchGroupType,
                'searchGroup',
            ),
            visitOptionalNode(
                new ListVisitor(),
                ctx.fieldSpecList(),
                isFieldSpecListType,
                'fieldSpecList',
            ),
            ctx.soslWithClause_list() && ctx.soslWithClause_list().length > 0
                ? visitNodeList(
                      new ClauseVisitor(),
                      ctx.soslWithClause_list(),
                      isSoslWithClauseType,
                      'soslWithClause',
                  )
                : null,
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.limitClause(),
                isLimitClauseType,
                'limitClause',
            ),
            ctx.UPDATE() &&
                visitOptionalNode(
                    new ListVisitor(),
                    ctx.updateList(),
                    isUpdateListType,
                    'updateList',
                ),
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
