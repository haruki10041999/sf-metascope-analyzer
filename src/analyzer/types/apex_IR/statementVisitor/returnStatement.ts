import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ReturnStatementTypeClass extends StatementTypeClass<
    'returnStatement',
    BasedExpressionTypeClass | null
> {
    private constructor(value: BasedExpressionTypeClass | ApexErrorTypeClass | null) {
        super('returnStatement', value);
    }

    static create(ctx: ReturnStatementContext): ReturnStatementTypeClass {
        // void メソッドの `return;` は式を持たない
        return new ReturnStatementTypeClass(
            ctx.expression()
                ? isApexValidClass(
                      new ExpressionVisitor().visit(ctx.expression()),
                      isBasedExpressionType,
                      'expression',
                  )
                : null,
        );
    }
}

export const isReturnStatementType = (
    target: ApexCommonTypeClass<string>,
): target is ReturnStatementTypeClass => {
    return target instanceof ReturnStatementTypeClass;
};

