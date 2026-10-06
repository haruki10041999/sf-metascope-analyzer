import { UpdateStatementContext } from '@apexdevtools/apex-parser';

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

export class UpdateStatementTypeClass extends DmlStatementTypeClass<ExpressionAllTypeClass> {
    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super('updateStatement', value, accessLevel);
    }

    static create(ctx: UpdateStatementContext): UpdateStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UpdateStatementContext: ' + ctx.getText());
        }

        return new UpdateStatementTypeClass(
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

export const isUpdateStatementType = (
    target: CommonTypeClass,
): target is UpdateStatementTypeClass => {
    return target instanceof UpdateStatementTypeClass;
};

