import { WhileStatementContext } from '@apexdevtools/apex-parser';

import {
    NormalStatementTypeClass,
    StatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '.';

import {
    ParExpressionTypeClass,
    ExpressionVisitor,
    isParExpressionType,
} from '../expressionVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class WhileStatementTypeClass extends StatementTypeClass<
    'whileStatement',
    ParExpressionTypeClass
> {
    private block: NormalStatementTypeClass | ApexErrorTypeClass;

    private constructor(
        value: ParExpressionTypeClass | ApexErrorTypeClass,
        block: NormalStatementTypeClass | ApexErrorTypeClass,
    ) {
        super('whileStatement', value);
        this.block = block;
    }

    static create(ctx: WhileStatementContext): WhileStatementTypeClass {
        if (!ctx.parExpression() || !ctx.statement()) {
            throw new Error('値が異常です。WhileStatementContext: ' + ctx.getText());
        }

        return new WhileStatementTypeClass(
            visitNode(
                new ExpressionVisitor(),
                ctx.parExpression(),
                isParExpressionType,
                'parExpression',
            ),
            visitNode(new StatementVisitor(), ctx.statement(), isNormalStatementType, 'statement'),
        );
    }

    getBlock() {
        return this.block;
    }
}

export const isWhileStatementType = (
    target: ApexCommonTypeClass<string>,
): target is WhileStatementTypeClass => {
    return target instanceof WhileStatementTypeClass;
};
