import { GroupByClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type GroupByClauseType = {
    type: 'groupByClause';
    clause: {
        fields: ListType;
        mode?: 'ROLLUP' | 'CUBE';
        having?: ExpressionType;
    };
};

export const makeGroupByClauseType = (ctx: GroupByClauseContext): GroupByClauseType => {
    const fields = new ListVisitor().visit(ctx.fieldGroupByList());

    const groupByClauseType: GroupByClauseType = {
        type: 'groupByClause',
        clause: {
            fields: fields,
        },
    };

    if (ctx.ROLLUP()) {
        groupByClauseType.clause.mode = 'ROLLUP';
    }

    if (ctx.CUBE()) {
        groupByClauseType.clause.mode = 'CUBE';
    }

    if (ctx.HAVING() && ctx.logicalExpression()) {
        const having = new ExpressionVisitor().visit(ctx.logicalExpression());
        groupByClauseType.clause.having = having;
    }

    return groupByClauseType;
};

