import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ThrowStatementTypeClass extends StatementTypeClass<
    'throwStatement',
    BasedExpressionTypeClass
> {
    private constructor(value: BasedExpressionTypeClass | ApexErrorTypeClass) {
        super('throwStatement', value);
    }

    static create(ctx: ThrowStatementContext): ThrowStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。ThrowStatementContext: ' + ctx.getText());
        }

        return new ThrowStatementTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isThrowStatementType = (
    target: ApexCommonTypeClass<string>,
): target is ThrowStatementTypeClass => {
    return target instanceof ThrowStatementTypeClass;
};

