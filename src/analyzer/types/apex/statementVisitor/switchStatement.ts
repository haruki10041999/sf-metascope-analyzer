import { SwitchStatementContext } from '@apexdevtools/apex-parser';

import { ControlType, ControlVisitor } from '../controlVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type SwitchStatementType = {
    type: 'switchStatement';
    variant: Omit<ExpressionType, 'type'>;
    whenBlocks: Omit<ControlType, 'type'>[];
};

export const makeSwitchStatementType = (ctx: SwitchStatementContext): SwitchStatementType => {
    const { type, ...valriant } = new ExpressionVisitor().visit(ctx.expression());
    const whenBlocks = ctx.whenControl_list().map((whenControlCtx) => {
        const { type, ...block } = new ControlVisitor().visit(whenControlCtx);
        return block;
    });

    return {
        type: 'switchStatement',
        variant: valriant,
        whenBlocks: whenBlocks,
    };
};

