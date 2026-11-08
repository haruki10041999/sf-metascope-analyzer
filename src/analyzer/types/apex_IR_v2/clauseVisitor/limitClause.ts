import { LimitClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class LimitClauseTypeClass extends ClauseTypeClass<
    'limitClause',
    string | BoundExpressionTypeClass
> {
    private constructor(value: string | BoundExpressionTypeClass | ApexErrorTypeClass) {
        super('limitClause', value);
    }

    static create(ctx: LimitClauseContext): LimitClauseTypeClass {
        if (!ctx.IntegerLiteral() && !ctx.boundExpression()) {
            throw new Error('値が異常です。LimitClauseContext: ' + ctx.getText());
        }

        return new LimitClauseTypeClass(
            ctx.IntegerLiteral()
                ? ctx.IntegerLiteral().getText()
                : visitNode(
                      new ExpressionVisitor(),
                      ctx.boundExpression(),
                      isBoundExpressionType,
                      'boundExpression',
                  ),
        );
    }
}

export const isLimitClauseType = (
    target: ApexCommonTypeClass<string>,
): target is LimitClauseTypeClass => {
    return target instanceof LimitClauseTypeClass;
};
