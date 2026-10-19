import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ExpressionStatementTypeClass extends StatementTypeClass<BasedExpressionTypeClass> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass) {
        super('expressionStatement', value);
    }

    static create(ctx: ExpressionStatementContext): ExpressionStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ExpressionStatementContext: ' + ctx.getText());
        }

        return new ExpressionStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionTypeClass,
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

