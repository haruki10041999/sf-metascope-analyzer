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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

type IfStatementTypeClassType = {
    value: ParExpressionTypeClass | 'else' | ApexErrorTypeClass;
    block: NormalStatementTypeClass | ApexErrorTypeClass;
};

export class IfStatementTypeClass extends StatementTypeClass<
    'ifStatement',
    IfStatementTypeClassType[]
> {
    private constructor(value: IfStatementTypeClassType[] | ApexErrorTypeClass) {
        super('ifStatement', value);
    }

    static create(ctx: IfStatementContext): IfStatementTypeClass {
        if (!ctx.parExpression() || !ctx.statement_list() || ctx.statement_list().length === 0) {
            throw new Error('値が異常です。IfStatementContext: ' + ctx.getText());
        }

        const conditionTypes: IfStatementTypeClassType[] = [];

        let currentCtx: IfStatementContext | undefined = ctx;
        while (currentCtx) {
            const currentCondition = isApexValidClass(
                new ExpressionVisitor().visit(currentCtx.parExpression()),
                isParExpressionType,
                'parExpression',
            );

            const statements: StatementContext[] = currentCtx.statement_list();

            const currentStatement = isApexValidClass(
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

            const elseStatement = isApexValidClass(
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

        return new IfStatementTypeClass(conditionTypes);
    }
}

export const isIfStatementType = (
    target: ApexCommonTypeClass<string>,
): target is IfStatementTypeClass => {
    return target instanceof IfStatementTypeClass;
};

