import { IfStatementContext, StatementContext } from '@apexdevtools/apex-parser';

import { StatementType, StatementVisitor } from '.';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

type ConditionType = {
    number: number;
    condition: Omit<ExpressionType, 'type'> | 'else';
    statement: Omit<StatementType, 'type'>;
};

export type IfStatementType = {
    type: 'ifStatement';
    conditions: ConditionType[];
};

export const makeIfStatementType = (ctx: IfStatementContext): IfStatementType => {
    const conditionTypes: ConditionType[] = [];

    let currentCtx: IfStatementContext | undefined = ctx;
    let count = 1;
    while (currentCtx) {
        const { type: currentConditionType, ...currentCondition } = new ExpressionVisitor().visit(
            currentCtx.parExpression(),
        );
        const statements: StatementContext[] = currentCtx.statement_list();
        const { type: currentStatementType, ...currentStatement } = new StatementVisitor().visit(
            statements.at(0)!,
        );
        conditionTypes.push({
            number: count,
            condition: currentCondition,
            statement: currentStatement,
        });

        if (!currentCtx.ELSE()) {
            break;
        }

        const elseStatementCtx = statements[1];

        if (!elseStatementCtx) {
            break;
        }

        const nestedIf = elseStatementCtx.ifStatement();

        if (nestedIf) {
            currentCtx = nestedIf;
            count++;
            continue;
        }

        const { type: elseStatementType, ...elseStatement } = new StatementVisitor().visit(
            elseStatementCtx,
        );
        conditionTypes.push({
            number: count + 1,
            condition: 'else',
            statement: elseStatement,
        });

        break;
    }

    return {
        type: 'ifStatement',
        conditions: conditionTypes,
    };
};

