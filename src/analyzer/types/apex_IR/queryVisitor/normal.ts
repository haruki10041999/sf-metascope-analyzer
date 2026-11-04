import { QueryContext } from '@apexdevtools/apex-parser';

import { SoqlQueryTypeClass } from '.';

import {
    SelectListTypeClass,
    FromNameListTypeClass,
    UpdateListTypeClass,
    ListVisitor,
    isSelectListType,
    isFromNameListType,
    isUpdateListType,
} from '../listVisitor';
import {
    ForClausesTypeClass,
    UsingScopeTypeClass,
    WhereClauseTypeClass,
    WithClauseTypeClass,
    GroupByClauseTypeClass,
    OrderByClauseTypeClass,
    LimitClauseTypeClass,
    OffsetClauseTypeClass,
    AllRowsClauseTypeClass,
    ClauseVisitor,
    isForClausesType,
    isUsingScopeType,
    isWhereClauseType,
    isWithClauseType,
    isGroupByClauseType,
    isOrderByClauseType,
    isLimitClauseType,
    isOffsetClauseType,
    isAllRowsClauseType,
} from '../clauseVisitor';
import { ApexCommonTypeClass, ApexErrorTypeClass, isApexValidClass } from '../commonVisitor';

export class NormalQueryTypeClass extends SoqlQueryTypeClass<'query', SelectListTypeClass> {
    private usingScope: UsingScopeTypeClass | ApexErrorTypeClass | null = null;
    private withClause: WithClauseTypeClass | ApexErrorTypeClass | null = null;
    private groupByClause: GroupByClauseTypeClass | ApexErrorTypeClass | null = null;
    private offsetClause: OffsetClauseTypeClass | ApexErrorTypeClass | null = null;
    private allRowsClause: AllRowsClauseTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: SelectListTypeClass | ApexErrorTypeClass,
        from: FromNameListTypeClass | ApexErrorTypeClass,
        forClause: ForClausesTypeClass | ApexErrorTypeClass | null,
        usingScope: UsingScopeTypeClass | ApexErrorTypeClass | null,
        whereClause: WhereClauseTypeClass | ApexErrorTypeClass | null,
        withClause: WithClauseTypeClass | ApexErrorTypeClass | null,
        groupByClause: GroupByClauseTypeClass | ApexErrorTypeClass | null,
        orderByClause: OrderByClauseTypeClass | ApexErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null,
        offsetClause: OffsetClauseTypeClass | ApexErrorTypeClass | null,
        allRowsClause: AllRowsClauseTypeClass | ApexErrorTypeClass | null,
        updateList: UpdateListTypeClass | ApexErrorTypeClass | null,
    ) {
        super('query', value, from, forClause, whereClause, orderByClause, limitClause, updateList);
        this.usingScope = usingScope;
        this.withClause = withClause;
        this.groupByClause = groupByClause;
        this.offsetClause = offsetClause;
        this.allRowsClause = allRowsClause;
    }

    static create(ctx: QueryContext): NormalQueryTypeClass {
        if (!ctx.selectList() || !ctx.fromNameList()) {
            throw new Error('値が異常です。QueryContext: ' + ctx.getText());
        }

        return new NormalQueryTypeClass(
            isApexValidClass(
                new ListVisitor().visit(ctx.selectList()),
                isSelectListType,
                'selectList',
            ),
            isApexValidClass(
                new ListVisitor().visit(ctx.fromNameList()),
                isFromNameListType,
                'fromNameList',
            ),
            // forClauses は文法上常に生成されるため、FOR が無ければ null にする
            ctx.forClauses() && ctx.forClauses().FOR_list().length > 0
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.forClauses()),
                      isForClausesType,
                      'forClauses',
                  )
                : null,
            ctx.usingScope()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.usingScope()),
                      isUsingScopeType,
                      'usingScope',
                  )
                : null,
            ctx.whereClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.whereClause()),
                      isWhereClauseType,
                      'whereClause',
                  )
                : null,
            ctx.withClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.withClause()),
                      isWithClauseType,
                      'withClause',
                  )
                : null,
            ctx.groupByClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.groupByClause()),
                      isGroupByClauseType,
                      'groupByClause',
                  )
                : null,
            ctx.orderByClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.orderByClause()),
                      isOrderByClauseType,
                      'orderByClause',
                  )
                : null,
            ctx.limitClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.limitClause()),
                      isLimitClauseType,
                      'limitClause',
                  )
                : null,
            ctx.offsetClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.offsetClause()),
                      isOffsetClauseType,
                      'offsetClause',
                  )
                : null,
            ctx.allRowsClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.allRowsClause()),
                      isAllRowsClauseType,
                      'allRowsClause',
                  )
                : null,
            ctx.updateList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.updateList()),
                      isUpdateListType,
                      'updateList',
                  )
                : null,
        );
    }

    getUsingScope(): UsingScopeTypeClass | ApexErrorTypeClass | null {
        return this.usingScope;
    }

    getWithClause(): WithClauseTypeClass | ApexErrorTypeClass | null {
        return this.withClause;
    }

    getGroupByClause(): GroupByClauseTypeClass | ApexErrorTypeClass | null {
        return this.groupByClause;
    }

    getOffsetClause(): OffsetClauseTypeClass | ApexErrorTypeClass | null {
        return this.offsetClause;
    }

    getAllRowsClause(): AllRowsClauseTypeClass | ApexErrorTypeClass | null {
        return this.allRowsClause;
    }
}

export const isNormalQueryType = (
    target: ApexCommonTypeClass<string>,
): target is NormalQueryTypeClass => {
    return target instanceof NormalQueryTypeClass;
};

