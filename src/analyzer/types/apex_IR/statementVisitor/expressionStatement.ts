import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class ExpressionStatementTypeClass extends StatementTypeClass<
    'expressionStatement',
    BasedExpressionTypeClass
> {
    private constructor(value: BasedExpressionTypeClass | ApexErrorTypeClass) {
        super('expressionStatement', value);
    }

    static create(ctx: ExpressionStatementContext): ExpressionStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ExpressionStatementContext: ' + ctx.getText());
        }

        return new ExpressionStatementTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isExpressionStatementType = (
    target: ApexCommonTypeClass<string>,
): target is ExpressionStatementTypeClass => {
    return target instanceof ExpressionStatementTypeClass;
};
