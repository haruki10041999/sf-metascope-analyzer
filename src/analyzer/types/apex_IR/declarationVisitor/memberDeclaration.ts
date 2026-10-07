import { MemberDeclarationContext } from '@apexdevtools/apex-parser';

import {
    MethodDeclarationTypeClass,
    ConstructorDeclarationTypeClass,
    InterfaceDeclarationTypeClass,
    ClassDeclarationTypeClass,
    EnumDeclarationTypeClass,
    PropertyDeclarationTypeClass,
    FieldDeclarationTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isMethodDeclarationType,
    isConstructorDeclarationType,
    isInterfaceDeclarationType,
    isClassDeclarationType,
    isEnumDeclarationType,
    isPropertyDeclarationType,
    isFieldDeclarationType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type MemberDeclarationTypeClassType =
    | MethodDeclarationTypeClass
    | ConstructorDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export class MemberDeclarationTypeClass extends DeclarationTypeClass<MemberDeclarationTypeClassType> {
    private constructor(value: MemberDeclarationTypeClassType | ErrorTypeClass) {
        super('memberDeclaration', value);
    }

    static create(ctx: MemberDeclarationContext): MemberDeclarationTypeClass {
        if (
            !ctx.methodDeclaration() &&
            !ctx.constructorDeclaration() &&
            !ctx.interfaceDeclaration() &&
            !ctx.classDeclaration() &&
            !ctx.enumDeclaration() &&
            !ctx.propertyDeclaration() &&
            !ctx.fieldDeclaration()
        ) {
            throw new Error('値が異常です。MemberDeclarationContext: ' + ctx.getText());
        }

        let value: MemberDeclarationTypeClassType | ErrorTypeClass;
        if (ctx.methodDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.methodDeclaration()),
                isMethodDeclarationType,
                'MethodDeclaration',
            );
        } else if (ctx.constructorDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.constructorDeclaration()),
                isConstructorDeclarationType,
                'ConstructorDeclaration',
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

        return new MemberDeclarationTypeClass(value);
    }
}

export const isMemberDeclarationType = (
    target: CommonTypeClass,
): target is MemberDeclarationTypeClass => {
    return target instanceof MemberDeclarationTypeClass;
};
