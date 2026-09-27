import { GroupByClauseContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type GroupByClauseType = {
    type: 'groupByClause';
    fields: Omit<ListType, 'type'>;
    mode?: 'ROLLUP' | 'CUBE';
    having?: Omit<ExpressionType, 'type'>;
};

export const makeGroupByClauseType = (ctx:GroupByClauseContext):GroupByClauseType => {
    const {type,..fields} = new ListVisitor().visit(ctx.fieldGroupByList());

    const groupByClauseType:GroupByClauseType = {
        type:'groupByClause',
        fields:fields
    }

    if (ctx.ROLLUP()) {
        groupByClauseType.mode = 'ROLLUP';
    }

    if (ctx.CUBE()) {
        groupByClauseType.mode = 'CUBE';
    }

    if (ctx.HAVING() && ctx.logicalExpression()) {
        const {type,...having} = new ExpressionVisitor().visit(ctx.logicalExpression());
        groupByClauseType.having = having;
    }

    return groupByClauseType;
}