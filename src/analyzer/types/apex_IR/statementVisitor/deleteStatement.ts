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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class DeleteStatementTypeClass extends DmlStatementTypeClass<
    'deleteStatement',
    BasedExpressionTypeClass
> {
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super('deleteStatement', value, accessLevel);
    }

    static create(ctx: DeleteStatementContext): DeleteStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。DeleteStatementContext: ' + ctx.getText());
        }

        return new DeleteStatementTypeClass(
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

export const isDeleteStatementType = (
    target: ApexCommonTypeClass<string>,
): target is DeleteStatementTypeClass => {
    return target instanceof DeleteStatementTypeClass;
};
