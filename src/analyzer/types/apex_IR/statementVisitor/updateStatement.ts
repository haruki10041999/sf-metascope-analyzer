import { UpdateStatementContext } from '@apexdevtools/apex-parser';

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

export type UpdateStatementType = TypeField<'updateStatement'> & {
    value: BasedExpressionTypeClass;
    accessLevel: AccessLevelTypeClass | null;
};

export class UpdateStatementTypeClass extends ApexCommonTypeClass<
    'updateStatement',
    UpdateStatementType
> {
    private constructor(fields: FieldsOf<UpdateStatementType>, sourceSpan: SourceSpan) {
        super('updateStatement', fields, sourceSpan);
    }

    static create(ctx: UpdateStatementContext): UpdateStatementTypeClass {
        return new UpdateStatementTypeClass(
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

    getValue(): UpdateStatementType['value'] {
        return this.getFields().value;
    }

    getAccessLevel(): UpdateStatementType['accessLevel'] {
        return this.getFields().accessLevel;
    }
}

export const isUpdateStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is UpdateStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('updateStatement', target);
};
