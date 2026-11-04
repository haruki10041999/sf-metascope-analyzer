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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export type TypeDeclarationClassType =
    ClassDeclarationTypeClass | EnumDeclarationTypeClass | InterfaceDeclarationTypeClass;

export class TypeDeclarationTypeClass extends DeclarationTypeClass<
    'typeDeclaration',
    TypeDeclarationClassType
> {
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[];
    private constructor(
        value: TypeDeclarationClassType | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('typeDeclaration', value);
        this.modifier = modifier;
    }

    static create(ctx: TypeDeclarationContext): TypeDeclarationTypeClass {
        if (!ctx.classDeclaration() && !ctx.enumDeclaration() && !ctx.interfaceDeclaration()) {
            throw new Error('値が異常です。TypeDeclarationType: ' + ctx.getText());
        }

        let value: TypeDeclarationClassType | ApexErrorTypeClass;
        if (ctx.classDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.classDeclaration()),
                isClassDeclarationType,
                'classDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.enumDeclaration()),
                isEnumDeclarationType,
                'enumDeclaration',
            );
        } else {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.interfaceDeclaration()),
                isInterfaceDeclarationType,
                'interfaceDeclaration',
            );
        }

        return new TypeDeclarationTypeClass(
            value,
            isApexValidClassList(
                ctx.modifier_list(),
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isTypeDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is TypeDeclarationTypeClass => {
    return target instanceof TypeDeclarationTypeClass;
};

