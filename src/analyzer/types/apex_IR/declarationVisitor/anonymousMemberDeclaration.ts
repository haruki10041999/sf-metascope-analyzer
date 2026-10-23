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

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

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
    private constructor(value: AnonymousMemberDeclarationTypeClassType | ErrorTypeClass) {
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

        let value: AnonymousMemberDeclarationTypeClassType | ErrorTypeClass;
        if (ctx.methodDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.methodDeclaration()),
                isMethodDeclarationType,
                'MethodDeclaration',
            );
        } else if (ctx.interfaceDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.interfaceDeclaration()),
                isInterfaceDeclarationType,
                'InterfaceDeclaration',
            );
        } else if (ctx.classDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.classDeclaration()),
                isClassDeclarationType,
                'ClassDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.enumDeclaration()),
                isEnumDeclarationType,
                'EnumDeclaration',
            );
        } else if (ctx.propertyDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.propertyDeclaration()),
                isPropertyDeclarationType,
                'PropertyDeclaration',
            );
        } else {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.fieldDeclaration()),
                isFieldDeclarationType,
                'FieldDeclaration',
            );
        }

        return new AnonymousMemberDeclarationTypeClass(value);
    }
}

export const isAnonymousMemberDeclarationType = (
    target: CommonTypeClass<string>,
): target is AnonymousMemberDeclarationTypeClass => {
    return target instanceof AnonymousMemberDeclarationTypeClass;
};
