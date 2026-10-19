import { DeleteStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DeleteStatementTypeClass extends DmlStatementTypeClass<BasedExpressionTypeClass> {
    private constructor(
        value: BasedExpressionTypeClass | ErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super('deleteStatement', value, accessLevel);
    }

    static create(ctx: DeleteStatementContext): DeleteStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。DeleteStatementContext: ' + ctx.getText());
        }

        return new DeleteStatementTypeClass(
            isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
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

export const isDeleteStatementType = (
    target: CommonTypeClass,
): target is DeleteStatementTypeClass => {
    return target instanceof DeleteStatementTypeClass;
};
