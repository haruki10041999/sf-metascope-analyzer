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
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class WhileStatementTypeClass extends StatementTypeClass<ParExpressionTypeClass> {
    private block: NormalStatementTypeClass | ErrorTypeClass;

    private constructor(
        value: ParExpressionTypeClass | ErrorTypeClass,
        block: NormalStatementTypeClass | ErrorTypeClass,
    ) {
        super('whileStatement', value);
        this.block = block;
    }

    static create(ctx: WhileStatementContext): WhileStatementTypeClass {
        if (!ctx.parExpression() || !ctx.statement()) {
            throw new Error('値が異常です。WhileStatementContext: ' + ctx.getText());
        }

        return new WhileStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.parExpression()),
                isParExpressionType,
                'parExpression',
            ),
            isValidClass(
                new StatementVisitor().visit(ctx.statement()),
                isNormalStatementType,
                'statement',
            ),
        );
    }

    getBlock() {
        return this.block;
    }
}

export const isWhileStatementType = (
    target: CommonTypeClass,
): target is WhileStatementTypeClass => {
    return target instanceof WhileStatementTypeClass;
};

