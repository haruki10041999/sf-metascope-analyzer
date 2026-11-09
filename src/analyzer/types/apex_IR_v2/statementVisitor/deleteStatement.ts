import { DeleteStatementContext } from '@apexdevtools/apex-parser';

import { AccessLevelTypeClass } from './accessLevel';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type DeleteStatementType = TypeField<'deleteStatement'> & {
    value: BasedExpressionTypeClass;
    accessLevel: AccessLevelTypeClass | null;
};

export class DeleteStatementTypeClass extends ApexCommonTypeClass<
    'deleteStatement',
    DeleteStatementType
> {
    private constructor(fields: FieldsOf<DeleteStatementType>, sourceSpan: SourceSpan) {
        super('deleteStatement', fields, sourceSpan);
    }

    static create(ctx: DeleteStatementContext): DeleteStatementTypeClass {
        return new DeleteStatementTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                accessLevel: createOptionalNode(
                    ctx.accessLevel(),
                    (c) => AccessLevelTypeClass.create(c),
                    'accessLevel',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): DeleteStatementType['value'] {
        return this.getFields().value;
    }

    getAccessLevel(): DeleteStatementType['accessLevel'] {
        return this.getFields().accessLevel;
    }
}

export const isDeleteStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is DeleteStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('deleteStatement', target);
};
