import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import { ExpressionTypeClass, ExpressionVisitor, isExpressionTypeAll } from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ReturnStatementTypeClass extends StatementTypeClass<ExpressionTypeClass<unknown>> {
    private constructor(
        value: ExpressionTypeClass<unknown> | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('returnStatement', value, errorClasses);
    }

    static create(ctx: ReturnStatementContext): ReturnStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ReturnStatementContext: ' + ctx.getText());
        }

        let value: ExpressionTypeClass<unknown> | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const expressionTypeClass = new ExpressionVisitor().visit(ctx.expression());
        if (isExpressionTypeAll(expressionTypeClass)) {
            value = expressionTypeClass;
        } else if (isErrorType(expressionTypeClass)) {
            errorClasses['value'] = expressionTypeClass;
        }

        return new ReturnStatementTypeClass(value, errorClasses);
    }
}

export const isReturnStatementType = (
    target: CommonTypeClass,
): target is ReturnStatementTypeClass => {
    return target instanceof ReturnStatementTypeClass;
};

