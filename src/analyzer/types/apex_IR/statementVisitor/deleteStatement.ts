import { DeleteStatementContext } from '@apexdevtools/apex-parser';

import {
    AccessLevelTypeClass,
    DmlStatementTypeClass,
    StatementVisitor,
    isAccessLevelType,
} from '.';

import {
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class DeleteStatementTypeClass extends DmlStatementTypeClass<ExpressionAllTypeClass> {
    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
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
                isExpressionTypeAll,
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

