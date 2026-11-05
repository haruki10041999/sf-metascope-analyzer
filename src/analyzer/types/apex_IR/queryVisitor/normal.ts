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
import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

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
            visitNode(new ListVisitor(), ctx.selectList(), isSelectListType, 'selectList'),
            visitNode(new ListVisitor(), ctx.fromNameList(), isFromNameListType, 'fromNameList'),
            // forClauses は文法上常に生成されるため、FOR が無ければ null にする
            ctx.forClauses() && ctx.forClauses().FOR_list().length > 0
                ? visitNode(new ClauseVisitor(), ctx.forClauses(), isForClausesType, 'forClauses')
                : null,
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.usingScope(),
                isUsingScopeType,
                'usingScope',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.whereClause(),
                isWhereClauseType,
                'whereClause',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.withClause(),
                isWithClauseType,
                'withClause',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.groupByClause(),
                isGroupByClauseType,
                'groupByClause',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.orderByClause(),
                isOrderByClauseType,
                'orderByClause',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.limitClause(),
                isLimitClauseType,
                'limitClause',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.offsetClause(),
                isOffsetClauseType,
                'offsetClause',
            ),
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.allRowsClause(),
                isAllRowsClauseType,
                'allRowsClause',
            ),
            visitOptionalNode(new ListVisitor(), ctx.updateList(), isUpdateListType, 'updateList'),
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
