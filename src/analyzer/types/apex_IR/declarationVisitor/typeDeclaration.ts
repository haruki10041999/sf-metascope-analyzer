import { TypeDeclarationContext } from '@apexdevtools/apex-parser';

import { ClassDeclarationTypeClass } from './classDeclaration';
import { EnumDeclarationTypeClass } from './enumDeclaration';
import { InterfaceDeclarationTypeClass } from './interfaceDeclaration';

import { ModifierTypeClass } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeDeclarationClassType =
    ClassDeclarationTypeClass | EnumDeclarationTypeClass | InterfaceDeclarationTypeClass;

export type TypeDeclarationType = TypeField<'typeDeclaration'> & {
    declaration: TypeDeclarationClassType;
    modifiers: ModifierTypeClass[];
};

export class TypeDeclarationTypeClass extends ApexCommonTypeClass<
    'typeDeclaration',
    TypeDeclarationType
> {
    private constructor(fields: FieldsOf<TypeDeclarationType>, sourceSpan: SourceSpan) {
        super('typeDeclaration', fields, sourceSpan);
    }

    static create(ctx: TypeDeclarationContext): TypeDeclarationTypeClass {
        let declaration: TypeDeclarationType['declaration'];
        if (ctx.classDeclaration()) {
            declaration = createNode(
                ctx.classDeclaration(),
                (c) => ClassDeclarationTypeClass.create(c),
                'classDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            declaration = createNode(
                ctx.enumDeclaration(),
                (c) => EnumDeclarationTypeClass.create(c),
                'enumDeclaration',
            );
        } else {
            declaration = createNode(
                ctx.interfaceDeclaration(),
                (c) => InterfaceDeclarationTypeClass.create(c),
                'interfaceDeclaration',
            );
        }

        return new TypeDeclarationTypeClass(
            {
                declaration,
                modifiers: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getDeclaration(): TypeDeclarationType['declaration'] {
        return this.getFields().declaration;
    }

    getModifiers(): TypeDeclarationType['modifiers'] {
        return this.getFields().modifiers;
    }
}

export const isTypeDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('typeDeclaration', target);
};
