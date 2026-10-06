import { LimitClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class LimitClauseTypeClass extends ClauseTypeClass<string | BoundExpressionTypeClass> {
    private constructor(value: string | BoundExpressionTypeClass | ErrorTypeClass) {
        super('limitClause', value);
    }

    static create(ctx: LimitClauseContext): LimitClauseTypeClass {
        if (!ctx.IntegerLiteral() && !ctx.boundExpression()) {
            throw new Error('値が異常です。LimitClauseContext: ' + ctx.getText());
        }

        return new LimitClauseTypeClass(
            ctx.IntegerLiteral()
                ? ctx.IntegerLiteral().getText()
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.boundExpression()),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
        );
    }
}

export const isLimitClauseType = (target: CommonTypeClass): target is LimitClauseTypeClass => {
    return target instanceof LimitClauseTypeClass;
};
