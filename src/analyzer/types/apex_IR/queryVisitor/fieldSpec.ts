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
import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

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
            visitNode(new IdVisitor(), ctx.soslId(0), isSoslIdType, 'soslId'),
            visitOptionalNode(new ListVisitor(), ctx.fieldList(), isFieldListType, 'fieldList'),
            visitOptionalNode(
                new ExpressionVisitor(),
                ctx.logicalExpression(),
                isLogicalExpressionType,
                'logicalExpression',
            ),
            visitOptionalNode(new IdVisitor(), listViewCtx, isSoslIdType, 'soslId'),
            visitOptionalNode(
                new ListVisitor(),
                ctx.fieldOrderList(),
                isFieldOrderListType,
                'fieldOrderList',
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
