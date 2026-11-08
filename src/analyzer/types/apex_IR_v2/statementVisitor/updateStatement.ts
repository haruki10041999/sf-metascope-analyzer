import { UpdateStatementContext } from '@apexdevtools/apex-parser';

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

export class UpdateStatementTypeClass extends DmlStatementTypeClass<
    'updateStatement',
    BasedExpressionTypeClass
> {
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super('updateStatement', value, accessLevel);
    }

    static create(ctx: UpdateStatementContext): UpdateStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UpdateStatementContext: ' + ctx.getText());
        }

        return new UpdateStatementTypeClass(
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

export const isUpdateStatementType = (
    target: ApexCommonTypeClass<string>,
): target is UpdateStatementTypeClass => {
    return target instanceof UpdateStatementTypeClass;
};
