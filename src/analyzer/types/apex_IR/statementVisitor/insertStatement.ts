import { InsertStatementContext } from '@apexdevtools/apex-parser';

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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class InsertStatementTypeClass extends DmlStatementTypeClass<
    'insertStatement',
    BasedExpressionTypeClass
> {
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super('insertStatement', value, accessLevel);
    }

    static create(ctx: InsertStatementContext): InsertStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。InsertStatementContext: ' + ctx.getText());
        }

        return new InsertStatementTypeClass(
            isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            ),
            ctx.accessLevel()
                ? isApexValidClass(
                      new StatementVisitor().visit(ctx.accessLevel()),
                      isAccessLevelType,
                      'accessLevel',
                  )
                : null,
        );
    }
}

export const isInsertStatementType = (
    target: ApexCommonTypeClass<string>,
): target is InsertStatementTypeClass => {
    return target instanceof InsertStatementTypeClass;
};

