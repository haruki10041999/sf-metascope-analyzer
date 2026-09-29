import { ForStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ControlType, ControlVisitor } from '../controlVisitor';

export type ForStatementType = {
    type: 'forStatement';
    statement: {
        control: ControlType;
        block: StatementType;
    };
};

export const makeForStatementType = (ctx: ForStatementContext): ForStatementType => {
    if (!ctx.forControl() || !ctx.statement()) {
        throw new Error('値が異常です。ForStatementContext: ' + ctx.getText());
    }

    const control = new ControlVisitor().visit(ctx.forControl());
    const block = new StatementVisitor().visit(ctx.statement());
    return {
        type: 'forStatement',
        statement: {
            control: control,
            block: block,
        },
    };
};

