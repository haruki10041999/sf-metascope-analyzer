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
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SubQueryTypeClass extends SoqlQueryTypeClass<SubFieldListTypeClass> {
    private constructor(
        value: SubFieldListTypeClass | ErrorTypeClass,
        from: FromNameListTypeClass | ErrorTypeClass,
        forClause: ForClausesTypeClass | ErrorTypeClass | null,
        whereClause: WhereClauseTypeClass | ErrorTypeClass | null,
        orderByClause: OrderByClauseTypeClass | ErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ErrorTypeClass | null,
        updateList: UpdateListTypeClass | ErrorTypeClass | null,
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
            isValidClass(
                new ListVisitor().visit(ctx.subFieldList()),
                isSubFieldListType,
                'subFieldList',
            ),
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
            ctx.whereClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.whereClause()),
                      isWhereClauseType,
                      'whereClause',
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
            ctx.updateList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.updateList()),
                      isUpdateListType,
                      'updateList',
                  )
                : null,
        );
    }
}

export const isSubQueryType = (target: CommonTypeClass): target is SubQueryTypeClass => {
    return target instanceof SubQueryTypeClass;
};

