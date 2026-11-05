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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

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
            visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            ),
            visitOptionalNode(
                new StatementVisitor(),
                ctx.accessLevel(),
                isAccessLevelType,
                'accessLevel',
            ),
        );
    }
}

export const isInsertStatementType = (
    target: ApexCommonTypeClass<string>,
): target is InsertStatementTypeClass => {
    return target instanceof InsertStatementTypeClass;
};
