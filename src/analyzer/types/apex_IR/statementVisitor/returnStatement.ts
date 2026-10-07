import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ReturnStatementTypeClass extends StatementTypeClass<ExpressionAllTypeClass | null> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass | null) {
        super('returnStatement', value);
    }

    static create(ctx: ReturnStatementContext): ReturnStatementTypeClass {
        // void メソッドの `return;` は式を持たない
        return new ReturnStatementTypeClass(
            ctx.expression()
                ? isValidClass(
                      new ExpressionVisitor().visit(ctx.expression()),
                      isExpressionTypeAll,
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

