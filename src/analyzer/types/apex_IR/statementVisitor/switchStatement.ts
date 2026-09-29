import { SwitchStatementContext } from '@apexdevtools/apex-parser';

import { ControlType, ControlVisitor } from '../controlVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type SwitchStatementType = {
    type: 'switchStatement';
    statement: {
        variant: ExpressionType;
        blocks: ControlType[];
    };
};

export const makeSwitchStatementType = (ctx: SwitchStatementContext): SwitchStatementType => {
    if (!ctx.expression() || !ctx.whenControl_list() || ctx.whenControl_list().length === 0) {
        throw new Error('値が異常です。SwitchStatementContext: ' + ctx.getText());
    }

    const name = new ExpressionVisitor().visit(ctx.expression());
    const whenBlocks = ctx.whenControl_list().map((whenControlCtx) => {
        const block = new ControlVisitor().visit(whenControlCtx);
        return block;
    });

    return {
        type: 'switchStatement',
        statement: {
            variant: name,
            blocks: whenBlocks,
        },
    };
};

