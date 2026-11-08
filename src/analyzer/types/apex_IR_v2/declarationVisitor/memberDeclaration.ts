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

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

type MemberDeclarationTypeClassType =
    | MethodDeclarationTypeClass
    | ConstructorDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export class MemberDeclarationTypeClass extends DeclarationTypeClass<
    'memberDeclaration',
    MemberDeclarationTypeClassType
> {
    private constructor(value: MemberDeclarationTypeClassType | ApexErrorTypeClass) {
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

        let value: MemberDeclarationTypeClassType | ApexErrorTypeClass;
        if (ctx.methodDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.methodDeclaration(),
                isMethodDeclarationType,
                'MethodDeclaration',
            );
        } else if (ctx.constructorDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.constructorDeclaration(),
                isConstructorDeclarationType,
                'ConstructorDeclaration',
            );
        } else if (ctx.interfaceDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.interfaceDeclaration(),
                isInterfaceDeclarationType,
                'InterfaceDeclaration',
            );
        } else if (ctx.classDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.classDeclaration(),
                isClassDeclarationType,
                'ClassDeclaration',
            );
        } else if (ctx.enumDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.enumDeclaration(),
                isEnumDeclarationType,
                'EnumDeclaration',
            );
        } else if (ctx.propertyDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.propertyDeclaration(),
                isPropertyDeclarationType,
                'PropertyDeclaration',
            );
        } else {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.fieldDeclaration(),
                isFieldDeclarationType,
                'FieldDeclaration',
            );
        }

        return new MemberDeclarationTypeClass(value);
    }
}

export const isMemberDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is MemberDeclarationTypeClass => {
    return target instanceof MemberDeclarationTypeClass;
};
