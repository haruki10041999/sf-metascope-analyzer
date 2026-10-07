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
import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class NormalQueryTypeClass extends SoqlQueryTypeClass<SelectListTypeClass> {
    private usingScope: UsingScopeTypeClass | ErrorTypeClass | null = null;
    private withClause: WithClauseTypeClass | ErrorTypeClass | null = null;
    private groupByClause: GroupByClauseTypeClass | ErrorTypeClass | null = null;
    private offsetClause: OffsetClauseTypeClass | ErrorTypeClass | null = null;
    private allRowsClause: AllRowsClauseTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: SelectListTypeClass | ErrorTypeClass,
        from: FromNameListTypeClass | ErrorTypeClass,
        forClause: ForClausesTypeClass | ErrorTypeClass | null,
        usingScope: UsingScopeTypeClass | ErrorTypeClass | null,
        whereClause: WhereClauseTypeClass | ErrorTypeClass | null,
        withClause: WithClauseTypeClass | ErrorTypeClass | null,
        groupByClause: GroupByClauseTypeClass | ErrorTypeClass | null,
        orderByClause: OrderByClauseTypeClass | ErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ErrorTypeClass | null,
        offsetClause: OffsetClauseTypeClass | ErrorTypeClass | null,
        allRowsClause: AllRowsClauseTypeClass | ErrorTypeClass | null,
        updateList: UpdateListTypeClass | ErrorTypeClass | null,
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
            isValidClass(new ListVisitor().visit(ctx.selectList()), isSelectListType, 'selectList'),
            isValidClass(
                new ListVisitor().visit(ctx.fromNameList()),
                isFromNameListType,
                'fromNameList',
            ),
            // forClauses は文法上常に生成されるため、FOR が無ければ null にする
            ctx.forClauses() && ctx.forClauses().FOR_list().length > 0
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.forClauses()),
                      isForClausesType,
                      'forClauses',
                  )
                : null,
            ctx.usingScope()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.usingScope()),
                      isUsingScopeType,
                      'usingScope',
                  )
                : null,
            ctx.whereClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.whereClause()),
                      isWhereClauseType,
                      'whereClause',
                  )
                : null,
            ctx.withClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.withClause()),
                      isWithClauseType,
                      'withClause',
                  )
                : null,
            ctx.groupByClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.groupByClause()),
                      isGroupByClauseType,
                      'groupByClause',
                  )
                : null,
            ctx.orderByClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.orderByClause()),
                      isOrderByClauseType,
                      'orderByClause',
                  )
                : null,
            ctx.limitClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.limitClause()),
                      isLimitClauseType,
                      'limitClause',
                  )
                : null,
            ctx.offsetClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.offsetClause()),
                      isOffsetClauseType,
                      'offsetClause',
                  )
                : null,
            ctx.allRowsClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.allRowsClause()),
                      isAllRowsClauseType,
                      'allRowsClause',
                  )
                : null,
            ctx.updateList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.updateList()),
                      isUpdateListType,
                      'updateList',
                  )
                : null,
        );
    }

    getUsingScope(): UsingScopeTypeClass | ErrorTypeClass | null {
        return this.usingScope;
    }

    getWithClause(): WithClauseTypeClass | ErrorTypeClass | null {
        return this.withClause;
    }

    getGroupByClause(): GroupByClauseTypeClass | ErrorTypeClass | null {
        return this.groupByClause;
    }

    getOffsetClause(): OffsetClauseTypeClass | ErrorTypeClass | null {
        return this.offsetClause;
    }

    getAllRowsClause(): AllRowsClauseTypeClass | ErrorTypeClass | null {
        return this.allRowsClause;
    }
}

export const isNormalQueryType = (target: CommonTypeClass): target is NormalQueryTypeClass => {
    return target instanceof NormalQueryTypeClass;
};

