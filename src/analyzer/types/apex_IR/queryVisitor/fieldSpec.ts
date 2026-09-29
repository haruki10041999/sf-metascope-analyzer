import { FieldSpecContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ListType, ListVisitor } from '../listVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type FieldSpecType = {
    type: 'fieldSpec';
    query: {
        objectName: IdType[];
        fieldList: ListType;
        where?: ExpressionType;
        usingListView: boolean;
        orderBy?: ListType;
        limit?: ClauseType;
        offset?: ClauseType;
    };
};

export const makeFieldSpecType = (ctx: FieldSpecContext): FieldSpecType => {
    if (!ctx.soslId_list() || !ctx.fieldList()) {
        throw new Error('値が異常です。FieldSpecContext: ' + ctx.getText());
    }

    const objectName = ctx.soslId_list().map((soslIdCtx) => {
        const soslId = new IdVisitor().visit(soslIdCtx);
        return soslId;
    });
    const fieldList = new ListVisitor().visit(ctx.fieldList());

    const fieldSpecType: FieldSpecType = {
        type: 'fieldSpec',
        query: {
            objectName: objectName,
            fieldList: fieldList,
            usingListView: Boolean(ctx.USING()) && Boolean(ctx.LISTVIEW()),
        },
    };

    if (ctx.WHERE() && ctx.logicalExpression()) {
        const where = new ExpressionVisitor().visit(ctx.logicalExpression());
        fieldSpecType.query.where = where;
    }

    if (ctx.ORDER() && ctx.BY() && ctx.fieldOrderList()) {
        const orderby = new ListVisitor().visit(ctx.fieldOrderList());
        fieldSpecType.query.orderBy = orderby;
    }

    if (ctx.limitClause()) {
        const limitClause = new ClauseVisitor().visit(ctx.limitClause());
        fieldSpecType.query.limit = limitClause;
    }

    if (ctx.offsetClause()) {
        const offsetClause = new ClauseVisitor().visit(ctx.offsetClause());
        fieldSpecType.query.offset = offsetClause;
    }

    return fieldSpecType;
};

