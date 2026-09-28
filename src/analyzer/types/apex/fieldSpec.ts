import { FieldSpecContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from './idVisitor';
import { ListType, ListVisitor } from './listVisitor';
import { ExpressionType, ExpressionVisitor } from './expressionVisitor';
import { ClauseType, ClauseVisitor } from './clauseVisitor';

export type FieldSpecType = {
    type: 'fieldSpec';
    objectName: IdType[];
    fieldList: ListType;
    where?: ExpressionType;
    usingListView: boolean;
    orderBy?: ListType;
    limit?: ClauseType;
    offset?: ClauseType;
};

export const makeFieldSpecType = (ctx: FieldSpecContext): FieldSpecType => {
    const objectName = ctx.soslId_list().map((soslIdCtx) => {
        const { type, ...soslId } = new IdVisitor().visit(soslIdCtx);
        return soslId;
    });
    const { type, ...fieldList } = new ListVisitor().visit(ctx.fieldList());

    const fieldSpecType: FieldSpecType = {
        type: 'fieldSpec',
        objectName: objectName,
        fieldList: fieldList,
        usingListView: ctx.USING() !== undefined && ctx.LISTVIEW() !== undefined,
    };

    if (ctx.WHERE() && ctx.logicalExpression()) {
        const { type, ...where } = new ExpressionVisitor().visit(ctx.logicalExpression());
        fieldSpecType.where = where;
    }

    if (ctx.ORDER() && ctx.BY() && ctx.fieldOrderList()) {
        const { type, ...orderby } = new ListVisitor().visit(ctx.fieldOrderList());
        fieldSpecType.orderBy = orderby;
    }

    if (ctx.limitClause()) {
        const { type, ...limitClause } = new ClauseVisitor().visit(ctx.limitClause());
        fieldSpecType.limit = limitClause;
    }

    if (ctx.offsetClause()) {
        const { type, ...offsetClause } = new ClauseVisitor().visit(ctx.offsetClause());
        fieldSpecType.offset = offsetClause;
    }

    return fieldSpecType;
};

