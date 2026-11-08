import { DeleteStatementContext } from '@apexdevtools/apex-parser';

import { AccessLevelTypeClass, isAccessLevelType } from '.';

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
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DeleteStatementType = TypeField<'deleteStatement'> & {
    value: BasedExpressionTypeClass;
    accessLevel: AccessLevelTypeClass | null;
};

export class DeleteStatementTypeClass extends ApexCommonTypeClass<
    'deleteStatement',
    DeleteStatementType
> {
    private constructor(
        value: BasedExpressionTypeClass,
        accessLevel: AccessLevelTypeClass | null,
        sourceSpan: SourceSpan,
    ) {
        super('deleteStatement', { value: value, accessLevel: accessLevel }, sourceSpan);
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
