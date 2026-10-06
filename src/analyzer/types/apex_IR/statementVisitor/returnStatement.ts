import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ReturnStatementTypeClass extends StatementTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass) {
        super('returnStatement', value);
    }

    static create(ctx: ReturnStatementContext): ReturnStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ReturnStatementContext: ' + ctx.getText());
        }

        return new ReturnStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isReturnStatementType = (
    target: CommonTypeClass,
): target is ReturnStatementTypeClass => {
    return target instanceof ReturnStatementTypeClass;
};

