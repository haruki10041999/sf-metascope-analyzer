import { InsertStatementContext } from '@apexdevtools/apex-parser';

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

export type InsertStatementType = TypeField<'insertStatement'> & {
    value: BasedExpressionTypeClass;
    accessLevel: AccessLevelTypeClass | null;
};

export class InsertStatementTypeClass extends ApexCommonTypeClass<
    'insertStatement',
    InsertStatementType
> {
    private constructor(fields: FieldsOf<InsertStatementType>, sourceSpan: SourceSpan) {
        super('insertStatement', fields, sourceSpan);
    }

    static create(ctx: InsertStatementContext): InsertStatementTypeClass {
        return new InsertStatementTypeClass(
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

    getValue(): InsertStatementType['value'] {
        return this.getFields().value;
    }

    getAccessLevel(): InsertStatementType['accessLevel'] {
        return this.getFields().accessLevel;
    }
}

export const isInsertStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is InsertStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('insertStatement', target);
};
