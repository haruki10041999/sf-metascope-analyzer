import { AnonymousMemberDeclarationContext } from '@apexdevtools/apex-parser';

import {
    MethodDeclarationTypeClass,
    InterfaceDeclarationTypeClass,
    ClassDeclarationTypeClass,
    EnumDeclarationTypeClass,
    PropertyDeclarationTypeClass,
    FieldDeclarationTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isMethodDeclarationType,
    isInterfaceDeclarationType,
    isClassDeclarationType,
    isEnumDeclarationType,
    isPropertyDeclarationType,
    isFieldDeclarationType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

type AnonymousMemberDeclarationTypeClassType =
    | MethodDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export class AnonymousMemberDeclarationTypeClass extends DeclarationTypeClass<
    'anonymousMemberDeclaration',
    AnonymousMemberDeclarationTypeClassType
> {
    private constructor(value: AnonymousMemberDeclarationTypeClassType | ApexErrorTypeClass) {
        super('anonymousMemberDeclaration', value);
    }

    static create(ctx: AnonymousMemberDeclarationContext): AnonymousMemberDeclarationTypeClass {
        if (
            !ctx.methodDeclaration() &&
            !ctx.interfaceDeclaration() &&
            !ctx.classDeclaration() &&
            !ctx.enumDeclaration() &&
            !ctx.propertyDeclaration() &&
            !ctx.fieldDeclaration()
        ) {
            throw new Error('値が異常です。AnonymousMemberDeclarationContext: ' + ctx.getText());
        }

        let value: AnonymousMemberDeclarationTypeClassType | ApexErrorTypeClass;
        if (ctx.methodDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.methodDeclaration()),
                isMethodDeclarationType,
                'MethodDeclaration',
            );
        } else if (ctx.interfaceDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.interfaceDeclaration()),
                isInterfaceDeclarationType,
                'InterfaceDeclaration',
            );
        } else if (ctx.classDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.classDeclaration()),
                isClassDeclarationType,
                'ClassDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.enumDeclaration()),
                isEnumDeclarationType,
                'EnumDeclaration',
            );
        } else if (ctx.propertyDeclaration()) {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.propertyDeclaration()),
                isPropertyDeclarationType,
                'PropertyDeclaration',
            );
        } else {
            value = isApexValidClass(
                new DeclarationVisitor().visit(ctx.fieldDeclaration()),
                isFieldDeclarationType,
                'FieldDeclaration',
            );
        }

        return new AnonymousMemberDeclarationTypeClass(value);
    }
}

export const isAnonymousMemberDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is AnonymousMemberDeclarationTypeClass => {
    return target instanceof AnonymousMemberDeclarationTypeClass;
};

