import { DoWhileStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import {
    ParExpressionTypeClass,
    ExpressionVisitor,
    isParExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DoWhileStatementTypeClass extends StatementTypeClass<ParExpressionTypeClass> {
    private block: NormalBlockTypeClass | ErrorTypeClass;

    private constructor(
        value: ParExpressionTypeClass | ErrorTypeClass,
        block: NormalBlockTypeClass | ErrorTypeClass,
    ) {
        super('doWhileStatement', value);
        this.block = block;
    }

    static create(ctx: DoWhileStatementContext): DoWhileStatementTypeClass {
        if (!ctx.parExpression() || !ctx.block()) {
            throw new Error('値が異常です。DoWhileStatementContext: ' + ctx.getText());
        }

        return new DoWhileStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.parExpression()),
                isParExpressionType,
                'parExpression',
            ),
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getBlock() {
        return this.block;
    }
}

export const isDoWhileStatementType = (
    target: CommonTypeClass,
): target is DoWhileStatementTypeClass => {
    return target instanceof DoWhileStatementTypeClass;
};

