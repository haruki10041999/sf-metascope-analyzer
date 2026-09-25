import { ForStatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';

import { ControlType, ControlVisitor } from '../controlVisitor';

export type ForStatementType = {
    type: 'forStatement';
    condition: Omit<ControlType, 'type'>;
    statement: Omit<StatementType, 'type'>;
};

export const makeForStatementType = (ctx: ForStatementContext): ForStatementType => {
    const { type: conditionType, ...condition } = new ControlVisitor().visit(ctx.forControl());
    const { type: statementType, ...statement } = new StatementVisitor().visit(ctx.statement());
    return {
        type: 'forStatement',
        condition: condition,
        statement: statement,
    };
};

