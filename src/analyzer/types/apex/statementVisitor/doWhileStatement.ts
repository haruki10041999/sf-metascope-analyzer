import { DoWhileStatementContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type DoWhileStatementType = {
    type: 'doWhileStatement';
    condition: Omit<ExpressionType, 'type'>;
    block: Omit<BlockType, 'type'>;
};

export const makeDoWhileStatementType = (ctx: DoWhileStatementContext): DoWhileStatementType => {
    const { type: conditionType, ...condition } = new ExpressionVisitor().visit(
        ctx.parExpression(),
    );
    const { type: blockType, ...block } = new BlockVisitor().visit(ctx.block());

    return {
        type: 'doWhileStatement',
        condition: condition,
        block: block,
    };
};

