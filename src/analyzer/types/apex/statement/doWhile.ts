import { DoWhileStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { BlockStatemtType, makeBlockStatemtType } from './block';

import { ExpressionField, ExpressionVisitor } from '../expression';

export type DoWhileStatementType = {
    type: 'doWhile';
    condition: ExpressionField;
    block: Omit<BlockStatemtType, 'type'>;
};

export const makeDoWhileStatementType = (ctx: DoWhileStatementContext): DoWhileStatementType => {
    const { type, ...block } = makeBlockStatemtType(ctx.block());

    return {
        type: 'doWhile',
        condition: new ExpressionVisitor().visit(ctx.parExpression().expression()),
        block: block,
    };
};

