import { WithClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    LogicalExpressionTypeClass,
    FilteringExpressionTypeClass,
    ExpressionVisitor,
    isFilteringExpressionType,
    isLogicalExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

type WithClauseType =
    | 'SYSTEM_MODE'
    | 'USER_MODE'
    | 'SECURITY_ENFORCED'
    | 'DATA_CATEGORY'
    | LogicalExpressionTypeClass;

export class WithClauseTypeClass extends ClauseTypeClass<'withClause', WithClauseType> {
    private field: FilteringExpressionTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: WithClauseType | ApexErrorTypeClass,
        field: FilteringExpressionTypeClass | ApexErrorTypeClass | null,
    ) {
        super('withClause', value);
        this.field = field;
    }

    static create(ctx: WithClauseContext): WithClauseTypeClass {
        if (
            !ctx.SYSTEM_MODE() &&
            !ctx.USER_MODE() &&
            !ctx.SECURITY_ENFORCED() &&
            !ctx.DATA() &&
            !ctx.CATEGORY() &&
            !ctx.logicalExpression()
        ) {
            throw new Error('値が異常です。WithClauseContext: ' + ctx.getText());
        }

        let value: WithClauseType | ApexErrorTypeClass;
        if (ctx.SYSTEM_MODE()) {
            value = 'SYSTEM_MODE';
        } else if (ctx.USER_MODE()) {
            value = 'USER_MODE';
        } else if (ctx.SECURITY_ENFORCED()) {
            value = 'SECURITY_ENFORCED';
        } else if (ctx.DATA() && ctx.CATEGORY()) {
            value = 'DATA_CATEGORY';
        } else {
            value = visitNode(
                new ExpressionVisitor(),
                ctx.logicalExpression(),
                isLogicalExpressionType,
                'logicalExpression',
            );
        }

        return new WithClauseTypeClass(
            value,
            ctx.DATA() && ctx.CATEGORY()
                ? visitNode(
                      new ExpressionVisitor(),
                      ctx.filteringExpression(),
                      isFilteringExpressionType,
                      'filteringExpression',
                  )
                : null,
        );
    }

    getField(): FilteringExpressionTypeClass | ApexErrorTypeClass | null {
        return this.field;
    }
}

export const isWithClauseType = (
    target: ApexCommonTypeClass<string>,
): target is WithClauseTypeClass => {
    return target instanceof WithClauseTypeClass;
};
