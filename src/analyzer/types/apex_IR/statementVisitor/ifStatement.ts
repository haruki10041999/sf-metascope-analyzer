import { IfStatementContext, StatementContext } from '@apexdevtools/apex-parser';

import {
    NormalStatementTypeClass,
    StatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '.';

import {
    ParExpressionTypeClass,
    ExpressionVisitor,
    isParExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type IfStatementTypeClassType = {
    value: ParExpressionTypeClass | 'else' | ErrorTypeClass;
    block: NormalStatementTypeClass | ErrorTypeClass;
};

export class IfStatementTypeClass extends StatementTypeClass<IfStatementTypeClassType[]> {
    private constructor(type: string, value: IfStatementTypeClassType[] | ErrorTypeClass) {
        super(type, value);
    }

    static create(ctx: IfStatementContext): IfStatementTypeClass {
        if (!ctx.parExpression() || !ctx.statement_list() || ctx.statement_list().length === 0) {
            throw new Error('値が異常です。IfStatementContext: ' + ctx.getText());
        }

        const conditionTypes: IfStatementTypeClassType[] = [];

        let currentCtx: IfStatementContext | undefined = ctx;
        while (currentCtx) {
            const currentCondition = isValidClass(
                new ExpressionVisitor().visit(currentCtx.parExpression()),
                isParExpressionType,
                'parExpression',
            );

            const statements: StatementContext[] = currentCtx.statement_list();

            const currentStatement = isValidClass(
                new StatementVisitor().visit(statements.at(0)!),
                isNormalStatementType,
                'statement',
            );
            conditionTypes.push({
                value: currentCondition,
                block: currentStatement,
            });

            if (!currentCtx.ELSE()) {
                break;
            }

            const elseStatementCtx = statements.at(1);

            if (!elseStatementCtx) {
                break;
            }

            const nestedIf = elseStatementCtx.ifStatement();

            if (nestedIf) {
                currentCtx = nestedIf;
                continue;
            }

            const elseStatement = isValidClass(
                new StatementVisitor().visit(elseStatementCtx),
                isNormalStatementType,
                'statement',
            );
            conditionTypes.push({
                value: 'else',
                block: elseStatement,
            });

            break;
        }

        return new IfStatementTypeClass('ifStatement', conditionTypes);
    }
}

export const isIfStatementType = (target: CommonTypeClass): target is IfStatementTypeClass => {
    return target instanceof IfStatementTypeClass;
};

