import { UndeleteStatementContext } from '@apexdevtools/apex-parser';

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

export type UndeleteStatementType = TypeField<'undeleteStatement'> & {
    value: BasedExpressionTypeClass;
    accessLevel: AccessLevelTypeClass | null;
};

export class UndeleteStatementTypeClass extends ApexCommonTypeClass<
    'undeleteStatement',
    UndeleteStatementType
> {
    private constructor(fields: FieldsOf<UndeleteStatementType>, sourceSpan: SourceSpan) {
        super('undeleteStatement', fields, sourceSpan);
    }

    static create(ctx: UndeleteStatementContext): UndeleteStatementTypeClass {
        return new UndeleteStatementTypeClass(
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

    getValue(): UndeleteStatementType['value'] {
        return this.getFields().value;
    }

    getAccessLevel(): UndeleteStatementType['accessLevel'] {
        return this.getFields().accessLevel;
    }
}

export const isUndeleteStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is UndeleteStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('undeleteStatement', target);
};
