import { SubQueryContext } from '@apexdevtools/apex-parser';

import { SoqlQueryTypeClass } from '.';

import {
    SubFieldListTypeClass,
    FromNameListTypeClass,
    UpdateListTypeClass,
    ListVisitor,
    isSubFieldListType,
    isFromNameListType,
    isUpdateListType,
} from '../listVisitor';
import {
    ForClausesTypeClass,
    WhereClauseTypeClass,
    OrderByClauseTypeClass,
    LimitClauseTypeClass,
    ClauseVisitor,
    isForClausesType,
    isWhereClauseType,
    isOrderByClauseType,
    isLimitClauseType,
} from '../clauseVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class SubQueryTypeClass extends SoqlQueryTypeClass<'subQuery', SubFieldListTypeClass> {
    private constructor(
        value: SubFieldListTypeClass | ApexErrorTypeClass,
        from: FromNameListTypeClass | ApexErrorTypeClass,
        forClause: ForClausesTypeClass | ApexErrorTypeClass | null,
        whereClause: WhereClauseTypeClass | ApexErrorTypeClass | null,
        orderByClause: OrderByClauseTypeClass | ApexErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null,
        updateList: UpdateListTypeClass | ApexErrorTypeClass | null,
    ) {
        super(
            'subQuery',
            value,
            from,
            forClause,
            whereClause,
            orderByClause,
            limitClause,
            updateList,
        );
    }

    static create(ctx: SubQueryContext): SubQueryTypeClass {
        if (!ctx.subFieldList() || !ctx.fromNameList()) {
            throw new Error('値が異常です。SubQueryContext: ' + ctx.getText());
        }

        return new SubQueryTypeClass(
            visitNode(new ListVisitor(), ctx.subFieldList(), isSubFieldListType, 'subFieldList'),
            visitNode(new ListVisitor(), ctx.fromNameList(), isFromNameListType, 'fromNameList'),
            // forClauses は文法上常に生成されるため、FOR が無ければ null にする
            ctx.forClauses() && ctx.forClauses().FOR_list().length > 0
                ? visitNode(new ClauseVisitor(), ctx.forClauses(), isForClausesType, 'forClauses')
                : null,
            visitOptionalNode(
                new ClauseVisitor(),
                ctx.whereClause(),
                isWhereClauseType,
                'whereClause',
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
            visitOptionalNode(new ListVisitor(), ctx.updateList(), isUpdateListType, 'updateList'),
        );
    }
}

export const isSubQueryType = (
    target: ApexCommonTypeClass<string>,
): target is SubQueryTypeClass => {
    return target instanceof SubQueryTypeClass;
};
