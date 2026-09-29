import { DoWhileStatementContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type DoWhileStatementType = {
    type: 'doWhileStatement';
    statement: {
        condition: ExpressionType;
        block: BlockType;
    };
};

export const makeDoWhileStatementType = (ctx: DoWhileStatementContext): DoWhileStatementType => {
    if (!ctx.parExpression() || !ctx.block()) {
        throw new Error('値が異常です。DoWhileStatementContext: ' + ctx.getText());
    }

    const condition = new ExpressionVisitor().visit(ctx.parExpression());
    const block = new BlockVisitor().visit(ctx.block());

    return {
        type: 'doWhileStatement',
        statement: {
            condition: condition,
            block: block,
        },
    };
};

