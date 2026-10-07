import { TypeDeclarationContext } from '@apexdevtools/apex-parser';

import {
    ClassDeclarationTypeClass,
    EnumDeclarationTypeClass,
    InterfaceDeclarationTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isClassDeclarationType,
    isEnumDeclarationType,
    isInterfaceDeclarationType,
} from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export type TypeDeclarationClassType =
    ClassDeclarationTypeClass | EnumDeclarationTypeClass | InterfaceDeclarationTypeClass;

export class TypeDeclarationTypeClass extends DeclarationTypeClass<TypeDeclarationClassType> {
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[];
    private constructor(
        value: TypeDeclarationClassType | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
    ) {
        super('typeDeclaration', value);
        this.modifier = modifier;
    }

    static create(ctx: TypeDeclarationContext): TypeDeclarationTypeClass {
        if (!ctx.classDeclaration() && !ctx.enumDeclaration() && !ctx.interfaceDeclaration()) {
            throw new Error('値が異常です。TypeDeclarationType: ' + ctx.getText());
        }

        let value: TypeDeclarationClassType | ErrorTypeClass;
        if (ctx.classDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.classDeclaration()),
                isClassDeclarationType,
                'classDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.enumDeclaration()),
                isEnumDeclarationType,
                'enumDeclaration',
            );
        } else {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.interfaceDeclaration()),
                isInterfaceDeclarationType,
                'interfaceDeclaration',
            );
        }

        return new TypeDeclarationTypeClass(
            value,
            isValidClassList(
                ctx.modifier_list(),
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isTypeDeclarationType = (
    target: CommonTypeClass,
): target is TypeDeclarationTypeClass => {
    return target instanceof TypeDeclarationTypeClass;
};

