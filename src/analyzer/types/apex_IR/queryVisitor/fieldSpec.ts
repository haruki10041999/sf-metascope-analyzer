import { FieldSpecContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from '../queryVisitor';

import { SoslIdTypeClass, IdVisitor, isSoslIdType } from '../idVisitor';
import {
    FieldListTypeClass,
    FieldOrderListTypeClass,
    ListVisitor,
    isFieldListType,
    isFieldOrderListType,
} from '../listVisitor';
import {
    LogicalExpressionTypeClass,
    ExpressionVisitor,
    isLogicalExpressionType,
} from '../expressionVisitor';
import {
    LimitClauseTypeClass,
    OffsetClauseTypeClass,
    ClauseVisitor,
    isLimitClauseType,
    isOffsetClauseType,
} from '../clauseVisitor';
import { ApexCommonTypeClass, ApexErrorTypeClass, isApexValidClass } from '../commonVisitor';

// value はオブジェクト名 (soslId[0])
export class FieldSpecTypeClass extends QueryTypeClass<'fieldSpec', SoslIdTypeClass> {
    private fieldList: FieldListTypeClass | ApexErrorTypeClass | null;
    private where: LogicalExpressionTypeClass | ApexErrorTypeClass | null;
    private listView: SoslIdTypeClass | ApexErrorTypeClass | null;
    private orderBy: FieldOrderListTypeClass | ApexErrorTypeClass | null;
    private limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null;
    private offsetClause: OffsetClauseTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: SoslIdTypeClass | ApexErrorTypeClass,
        fieldList: FieldListTypeClass | ApexErrorTypeClass | null,
        where: LogicalExpressionTypeClass | ApexErrorTypeClass | null,
        listView: SoslIdTypeClass | ApexErrorTypeClass | null,
        orderBy: FieldOrderListTypeClass | ApexErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null,
        offsetClause: OffsetClauseTypeClass | ApexErrorTypeClass | null,
    ) {
        super('fieldSpec', value);
        this.fieldList = fieldList;
        this.where = where;
        this.listView = listView;
        this.orderBy = orderBy;
        this.limitClause = limitClause;
        this.offsetClause = offsetClause;
    }

    static create(ctx: FieldSpecContext): FieldSpecTypeClass {
        if (!ctx.soslId_list() || ctx.soslId_list().length === 0) {
            throw new Error('値が異常です。FieldSpecContext: ' + ctx.getText());
        }

        // soslId[1] は USING LISTVIEW = xxx のビュー名
        const listViewCtx = ctx.LISTVIEW() ? ctx.soslId(1) : null;

        return new FieldSpecTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.soslId(0)), isSoslIdType, 'soslId'),
            ctx.fieldList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.fieldList()),
                      isFieldListType,
                      'fieldList',
                  )
                : null,
            ctx.logicalExpression()
                ? isApexValidClass(
                      new ExpressionVisitor().visit(ctx.logicalExpression()),
                      isLogicalExpressionType,
                      'logicalExpression',
                  )
                : null,
            listViewCtx
                ? isApexValidClass(new IdVisitor().visit(listViewCtx), isSoslIdType, 'soslId')
                : null,
            ctx.fieldOrderList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.fieldOrderList()),
                      isFieldOrderListType,
                      'fieldOrderList',
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
        );
    }

    getFieldList(): FieldListTypeClass | ApexErrorTypeClass | null {
        return this.fieldList;
    }

    getWhere(): LogicalExpressionTypeClass | ApexErrorTypeClass | null {
        return this.where;
    }

    getListView(): SoslIdTypeClass | ApexErrorTypeClass | null {
        return this.listView;
    }

    getOrderBy(): FieldOrderListTypeClass | ApexErrorTypeClass | null {
        return this.orderBy;
    }

    getLimitClause(): LimitClauseTypeClass | ApexErrorTypeClass | null {
        return this.limitClause;
    }

    getOffsetClause(): OffsetClauseTypeClass | ApexErrorTypeClass | null {
        return this.offsetClause;
    }
}

export const isFieldSpecType = (
    target: ApexCommonTypeClass<string>,
): target is FieldSpecTypeClass => {
    return target instanceof FieldSpecTypeClass;
};

