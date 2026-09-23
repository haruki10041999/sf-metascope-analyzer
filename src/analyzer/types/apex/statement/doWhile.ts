import { DoWhileStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { BlockStatemtType, makeBlockStatemtType } from './block';

export type DoWhileStatementType = {
    type: 'doWhile';
    condition: string;
    block: Omit<BlockStatemtType, 'type'>;
};

export const makeDoWhileStatementType = (ctx: DoWhileStatementContext): DoWhileStatementType => {
    const { type, ...block } = makeBlockStatemtType(ctx.block());

    return {
        type: 'doWhile',
        condition: ctx.parExpression().expression().getText(),
        block: block,
    };
};
