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
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class UndeleteStatementTypeClass extends DmlStatementTypeClass<
    'undeleteStatement',
    BasedExpressionTypeClass
> {
    private constructor(
        value: BasedExpressionTypeClass | ApexErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super('undeleteStatement', value, accessLevel);
    }

    static create(ctx: UndeleteStatementContext): UndeleteStatementTypeClass {
        if (!ctx.expression()) {
            throw new Error('値が異常です。UndeleteStatementContext: ' + ctx.getText());
        }

        return new UndeleteStatementTypeClass(
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

export const isUndeleteStatementType = (
    target: ApexCommonTypeClass<string>,
): target is UndeleteStatementTypeClass => {
    return target instanceof UndeleteStatementTypeClass;
};
