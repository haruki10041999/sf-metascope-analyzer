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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

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
            isApexValidClass(
                new ListVisitor().visit(ctx.subFieldList()),
                isSubFieldListType,
                'subFieldList',
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
            ctx.whereClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.whereClause()),
                      isWhereClauseType,
                      'whereClause',
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
            ctx.updateList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.updateList()),
                      isUpdateListType,
                      'updateList',
                  )
                : null,
        );
    }
}

export const isSubQueryType = (
    target: ApexCommonTypeClass<string>,
): target is SubQueryTypeClass => {
    return target instanceof SubQueryTypeClass;
};

