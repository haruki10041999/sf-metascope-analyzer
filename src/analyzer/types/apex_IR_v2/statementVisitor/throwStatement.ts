import { ThrowStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

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
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
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
