import { WhileStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { StatementField, makeStatementField } from '.';

export type WhileStatementType = {
    type: 'while';
    condition: string;
    statement: StatementField;
};

export const makeWhileStatementType = (ctx: WhileStatementContext): WhileStatementType => {
    return {
        type: 'while',
        condition: ctx.parExpression().expression().getText(),
        statement: makeStatementField(ctx.statement()),
    };
};
