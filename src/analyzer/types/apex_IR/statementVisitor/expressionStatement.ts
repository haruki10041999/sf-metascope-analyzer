import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ExpressionStatementTypeClass extends StatementTypeClass<ExpressionAllTypeClass> {
    private constructor(value: ExpressionAllTypeClass | ErrorTypeClass) {
        super('expressionStatement', value);
    }

    static create(ctx: ExpressionStatementContext): ExpressionStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ExpressionStatementContext: ' + ctx.getText());
        }

        return new ExpressionStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            ),
        );
    }
}

export const isExpressionStatementType = (
    target: CommonTypeClass,
): target is ExpressionStatementTypeClass => {
    return target instanceof ExpressionStatementTypeClass;
};

