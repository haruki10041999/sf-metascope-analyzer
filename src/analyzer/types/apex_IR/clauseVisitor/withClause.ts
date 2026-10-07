import { WithClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    LogicalExpressionTypeClass,
    FilteringExpressionTypeClass,
    ExpressionVisitor,
    isFilteringExpressionType,
    isLogicalExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class WithClauseTypeClass extends ClauseTypeClass<string | LogicalExpressionTypeClass> {
    private field: FilteringExpressionTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: string | LogicalExpressionTypeClass | ErrorTypeClass,
        field: FilteringExpressionTypeClass | ErrorTypeClass | null,
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

        let value: string | LogicalExpressionTypeClass | ErrorTypeClass;
        if (ctx.SYSTEM_MODE()) {
            value = 'SYSTEM_MODE';
        } else if (ctx.USER_MODE()) {
            value = 'USER_MODE';
        } else if (ctx.SECURITY_ENFORCED()) {
            value = 'SECURITY_ENFORCED';
        } else if (ctx.DATA() && ctx.CATEGORY()) {
            value = 'DATA_CATEGORY';
        } else {
            value = isValidClass(
                new ExpressionVisitor().visit(ctx.logicalExpression()),
                isLogicalExpressionType,
                'logicalExpression',
            );
        }

        return new WithClauseTypeClass(
            value,
            ctx.DATA() && ctx.CATEGORY()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.filteringExpression()),
                      isFilteringExpressionType,
                      'filteringExpression',
                  )
                : null,
        );
    }

    getField(): FilteringExpressionTypeClass | ErrorTypeClass | null {
        return this.field;
    }
}

export const isWithClauseType = (target: CommonTypeClass): target is WithClauseTypeClass => {
    return target instanceof WithClauseTypeClass;
};

