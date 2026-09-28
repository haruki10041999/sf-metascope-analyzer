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

