import { InsertStatementContext } from '@apexdevtools/apex-parser';

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

export class InsertStatementTypeClass extends DmlStatementTypeClass<ExpressionAllTypeClass> {
    private constructor(
        value: ExpressionAllTypeClass | ErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super('insertStatement', value, accessLevel);
    }

    static create(ctx: InsertStatementContext): InsertStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。InsertStatementContext: ' + ctx.getText());
        }

        return new InsertStatementTypeClass(
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

export const isInsertStatementType = (
    target: CommonTypeClass,
): target is InsertStatementTypeClass => {
    return target instanceof InsertStatementTypeClass;
};

