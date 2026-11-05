import { OffsetClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class OffsetClauseTypeClass extends ClauseTypeClass<
    'offsetClause',
    string | BoundExpressionTypeClass
> {
    private constructor(value: string | BoundExpressionTypeClass | ApexErrorTypeClass) {
        super('offsetClause', value);
    }

    static create(ctx: OffsetClauseContext): OffsetClauseTypeClass {
        if (!ctx.IntegerLiteral() && !ctx.boundExpression()) {
            throw new Error('値が異常です。OffsetClauseContext: ' + ctx.getText());
        }

        return new OffsetClauseTypeClass(
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

export const isOffsetClauseType = (
    target: ApexCommonTypeClass<string>,
): target is OffsetClauseTypeClass => {
    return target instanceof OffsetClauseTypeClass;
};
