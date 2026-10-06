import { OffsetClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import {
    BoundExpressionTypeClass,
    ExpressionVisitor,
    isBoundExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class OffsetClauseTypeClass extends ClauseTypeClass<string | BoundExpressionTypeClass> {
    private constructor(value: string | BoundExpressionTypeClass | ErrorTypeClass) {
        super('limitClause', value);
    }

    static create(ctx: OffsetClauseContext): OffsetClauseTypeClass {
        if (!ctx.IntegerLiteral() && !ctx.boundExpression()) {
            throw new Error('値が異常です。OffsetClauseContext: ' + ctx.getText());
        }

        return new OffsetClauseTypeClass(
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

export const isOffsetClauseType = (target: CommonTypeClass): target is OffsetClauseTypeClass => {
    return target instanceof OffsetClauseTypeClass;
};
