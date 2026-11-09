import { UpsertStatementContext } from '@apexdevtools/apex-parser';

import { AccessLevelTypeClass } from './accessLevel';

import { QualifiedNameTypeClass } from '../nameVisitor';
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

export type UpsertStatementType = TypeField<'upsertStatement'> & {
    value: BasedExpressionTypeClass;
    key: QualifiedNameTypeClass | null;
    accessLevel: AccessLevelTypeClass | null;
};

export class UpsertStatementTypeClass extends ApexCommonTypeClass<
    'upsertStatement',
    UpsertStatementType
> {
    private constructor(fields: FieldsOf<UpsertStatementType>, sourceSpan: SourceSpan) {
        super('upsertStatement', fields, sourceSpan);
    }

    static create(ctx: UpsertStatementContext): UpsertStatementTypeClass {
        return new UpsertStatementTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
                key: createOptionalNode(
                    ctx.qualifiedName(),
                    (c) => QualifiedNameTypeClass.create(c),
                    'qualifiedName',
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

    getValue(): UpsertStatementType['value'] {
        return this.getFields().value;
    }

    getKey(): UpsertStatementType['key'] {
        return this.getFields().key;
    }

    getAccessLevel(): UpsertStatementType['accessLevel'] {
        return this.getFields().accessLevel;
    }
}

export const isUpsertStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is UpsertStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('upsertStatement', target);
};
