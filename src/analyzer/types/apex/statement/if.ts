import { IfStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { StatementField, makeStatementField } from '.';

export type IfStatementType = {
    type: 'if';
    condition: string;
    statement: StatementField;
    elseStatment?: StatementField;
};

export const makeIfStatementType = (ctx: IfStatementContext): IfStatementType => {
    const condition = ctx.parExpression().expression().getText();

    const statementCtxs = ctx.statement_list();

    const ifStatementType: IfStatementType = {
        type: 'if',
        condition: condition,
        statement: makeStatementField(statementCtxs.at(0)!),
    };

    if (ctx.ELSE() && statementCtxs.length === 2) {
        ifStatementType.elseStatment = makeStatementField(statementCtxs.at(1)!);
    }

    return ifStatementType;
};
