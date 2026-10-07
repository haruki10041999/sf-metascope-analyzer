import { GroupByClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    LogicalExpressionTypeClass,
    ExpressionVisitor,
    isLogicalExpressionType,
} from '../expressionVisitor';
import { FieldGroupByListTypeClass, ListVisitor, isFieldGroupByListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class GroupByClauseTypeClass extends ClauseTypeClass<FieldGroupByListTypeClass> {
    private mode: string | null = null;
    private having: LogicalExpressionTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: FieldGroupByListTypeClass | ErrorTypeClass,
        mode: string | null,
        having: LogicalExpressionTypeClass | ErrorTypeClass | null,
    ) {
        super('groupByClause', value);
        this.mode = mode;
        this.having = having;
    }

    static create(ctx: GroupByClauseContext): GroupByClauseTypeClass {
        if (!ctx.fieldGroupByList()) {
            throw new Error('値が異常です。GroupByClauseContext: ' + ctx.getText());
        }

        return new GroupByClauseTypeClass(
            isValidClass(
                new ListVisitor().visit(ctx.fieldGroupByList()),
                isFieldGroupByListType,
                'fieldGroupByList',
            ),
            ctx.ROLLUP() ? 'ROLLUP' : ctx.CUBE() ? 'CUBE' : null,
            ctx.HAVING() && ctx.logicalExpression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.logicalExpression()),
                      isLogicalExpressionType,
                      'logicalExpression',
                  )
                : null,
        );
    }

    getMode(): string | null {
        return this.mode;
    }

    getHaving(): LogicalExpressionTypeClass | ErrorTypeClass | null {
        return this.having;
    }
}

export const isGroupByClauseType = (target: CommonTypeClass): target is GroupByClauseTypeClass => {
    return target instanceof GroupByClauseTypeClass;
};
