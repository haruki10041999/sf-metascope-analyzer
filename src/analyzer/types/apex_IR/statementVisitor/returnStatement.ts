import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ReturnStatementTypeClass extends StatementTypeClass<BasedExpressionTypeClass | null> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass | null) {
        super('returnStatement', value);
    }

    static create(ctx: ReturnStatementContext): ReturnStatementTypeClass {
        // void メソッドの `return;` は式を持たない
        return new ReturnStatementTypeClass(
            ctx.expression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.expression()),
                      isBasedExpressionType,
                      'expression',
                  )
                : null,
        );
    }
}

export const isReturnStatementType = (
    target: CommonTypeClass,
): target is ReturnStatementTypeClass => {
    return target instanceof ReturnStatementTypeClass;
};
