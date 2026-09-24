import { IfStatementContext, ParExpressionContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type IfStatementType = {
    type: 'if';
    condition: ExpressionType;
    statement: StatementType;
    elseStatment?: StatementType;
};

export const makeIfStatementType = (ctx: IfStatementContext): IfStatementType => {
    const condition: ExpressionType = new ExpressionVisitor().visit(
        ctx.parExpression().expression(),
    );

    const statementCtxs = ctx.statement_list();

    const ifStatementType: IfStatementType = {
        type: 'if',
        condition: condition,
        statement: new StatementVisitor().visit(statementCtxs.at(0)!),
    };

    if (ctx.ELSE() && statementCtxs.length === 2) {
        ifStatementType.elseStatment = new StatementVisitor().visit(statementCtxs.at(1)!);
    }

    return ifStatementType;
};
