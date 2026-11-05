import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitOptionalNode } from '../commonVisitor';

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
            visitOptionalNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
        );
    }
}

export const isReturnStatementType = (
    target: ApexCommonTypeClass<string>,
): target is ReturnStatementTypeClass => {
    return target instanceof ReturnStatementTypeClass;
};
