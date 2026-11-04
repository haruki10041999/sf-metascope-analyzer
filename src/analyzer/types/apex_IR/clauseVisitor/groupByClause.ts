import { GroupByClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    LogicalExpressionTypeClass,
    ExpressionVisitor,
    isLogicalExpressionType,
} from '../expressionVisitor';
import { FieldGroupByListTypeClass, ListVisitor, isFieldGroupByListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class GroupByClauseTypeClass extends ClauseTypeClass<
    'groupByClause',
    FieldGroupByListTypeClass
> {
    private mode: 'ROLLUP' | 'CUBE' | null = null;
    private having: LogicalExpressionTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: FieldGroupByListTypeClass | ApexErrorTypeClass,
        mode: 'ROLLUP' | 'CUBE' | null,
        having: LogicalExpressionTypeClass | ApexErrorTypeClass | null,
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
            isApexValidClass(
                new ListVisitor().visit(ctx.fieldGroupByList()),
                isFieldGroupByListType,
                'fieldGroupByList',
            ),
            ctx.ROLLUP() ? 'ROLLUP' : ctx.CUBE() ? 'CUBE' : null,
            ctx.HAVING() && ctx.logicalExpression()
                ? isApexValidClass(
                      new ExpressionVisitor().visit(ctx.logicalExpression()),
                      isLogicalExpressionType,
                      'logicalExpression',
                  )
                : null,
        );
    }

    getMode(): 'ROLLUP' | 'CUBE' | null {
        return this.mode;
    }

    getHaving(): LogicalExpressionTypeClass | ApexErrorTypeClass | null {
        return this.having;
    }
}

export const isGroupByClauseType = (
    target: ApexCommonTypeClass<string>,
): target is GroupByClauseTypeClass => {
    return target instanceof GroupByClauseTypeClass;
};

