import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { LocalVariableDeclarationTypeClass } from '../declarationVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type LocalVariableDeclarationStatementType =
    TypeField<'localVariableDeclarationStatement'> & {
        value: LocalVariableDeclarationTypeClass;
    };

export class LocalVariableDeclarationStatementTypeClass extends ApexCommonTypeClass<
    'localVariableDeclarationStatement',
    LocalVariableDeclarationStatementType
> {
    private constructor(
        fields: FieldsOf<LocalVariableDeclarationStatementType>,
        sourceSpan: SourceSpan,
    ) {
        super('localVariableDeclarationStatement', fields, sourceSpan);
    }

    static create(
        ctx: LocalVariableDeclarationStatementContext,
    ): LocalVariableDeclarationStatementTypeClass {
        return new LocalVariableDeclarationStatementTypeClass(
            {
                value: createNode(
                    ctx.localVariableDeclaration(),
                    (c) => LocalVariableDeclarationTypeClass.create(c),
                    'localVariableDeclaration',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): LocalVariableDeclarationStatementType['value'] {
        return this.getFields().value;
    }
}

export const isLocalVariableDeclarationStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LocalVariableDeclarationStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('localVariableDeclarationStatement', target);
};
