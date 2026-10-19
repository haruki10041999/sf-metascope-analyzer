import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ThrowStatementTypeClass extends StatementTypeClass<BasedExpressionTypeClass> {
    private constructor(value: BasedExpressionTypeClass | ErrorTypeClass) {
        super('throwStatement', value);
    }

    static create(ctx: ThrowStatementContext): ThrowStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ThrowStatementContext: ' + ctx.getText());
        }

        return new ThrowStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionTypeClass,
                'expression',
            ),
        );
    }
}

export const isThrowStatementType = (
    target: CommonTypeClass,
): target is ThrowStatementTypeClass => {
    return target instanceof ThrowStatementTypeClass;
};

