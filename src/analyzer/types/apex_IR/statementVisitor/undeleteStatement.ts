import { UndeleteStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionTypeClass,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class UndeleteStatementTypeClass extends DmlStatementTypeClass<BasedExpressionTypeClass> {
    private constructor(
        value: BasedExpressionTypeClass | ErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super('undeleteStatement', value, accessLevel);
    }

    static create(ctx: UndeleteStatementContext): UndeleteStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UndeleteStatementContext: ' + ctx.getText());
        }

        return new UndeleteStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionTypeClass,
                'expression',
            ),
            ctx.accessLevel()
                ? isValidClass(
                      new StatementVisitor().visit(ctx.accessLevel()),
                      isAccessLevelType,
                      'accessLevel',
                  )
                : null,
        );
    }
}

export const isUndeleteStatementType = (
    target: CommonTypeClass,
): target is UndeleteStatementTypeClass => {
    return target instanceof UndeleteStatementTypeClass;
};

