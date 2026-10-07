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
import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

// value はオブジェクト名 (soslId[0])
export class FieldSpecTypeClass extends QueryTypeClass<SoslIdTypeClass> {
    private fieldList: FieldListTypeClass | ErrorTypeClass | null;
    private where: LogicalExpressionTypeClass | ErrorTypeClass | null;
    private listView: SoslIdTypeClass | ErrorTypeClass | null;
    private orderBy: FieldOrderListTypeClass | ErrorTypeClass | null;
    private limitClause: LimitClauseTypeClass | ErrorTypeClass | null;
    private offsetClause: OffsetClauseTypeClass | ErrorTypeClass | null;

    private constructor(
        value: SoslIdTypeClass | ErrorTypeClass,
        fieldList: FieldListTypeClass | ErrorTypeClass | null,
        where: LogicalExpressionTypeClass | ErrorTypeClass | null,
        listView: SoslIdTypeClass | ErrorTypeClass | null,
        orderBy: FieldOrderListTypeClass | ErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ErrorTypeClass | null,
        offsetClause: OffsetClauseTypeClass | ErrorTypeClass | null,
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
            isValidClass(new IdVisitor().visit(ctx.soslId(0)), isSoslIdType, 'soslId'),
            ctx.fieldList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.fieldList()),
                      isFieldListType,
                      'fieldList',
                  )
                : null,
            ctx.logicalExpression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.logicalExpression()),
                      isLogicalExpressionType,
                      'logicalExpression',
                  )
                : null,
            listViewCtx
                ? isValidClass(new IdVisitor().visit(listViewCtx), isSoslIdType, 'soslId')
                : null,
            ctx.fieldOrderList()
                ? isValidClass(
                      new ListVisitor().visit(ctx.fieldOrderList()),
                      isFieldOrderListType,
                      'fieldOrderList',
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
        );
    }

    getFieldList(): FieldListTypeClass | ErrorTypeClass | null {
        return this.fieldList;
    }

    getWhere(): LogicalExpressionTypeClass | ErrorTypeClass | null {
        return this.where;
    }

    getListView(): SoslIdTypeClass | ErrorTypeClass | null {
        return this.listView;
    }

    getOrderBy(): FieldOrderListTypeClass | ErrorTypeClass | null {
        return this.orderBy;
    }

    getLimitClause(): LimitClauseTypeClass | ErrorTypeClass | null {
        return this.limitClause;
    }

    getOffsetClause(): OffsetClauseTypeClass | ErrorTypeClass | null {
        return this.offsetClause;
    }
}

export const isFieldSpecType = (target: CommonTypeClass): target is FieldSpecTypeClass => {
    return target instanceof FieldSpecTypeClass;
};

