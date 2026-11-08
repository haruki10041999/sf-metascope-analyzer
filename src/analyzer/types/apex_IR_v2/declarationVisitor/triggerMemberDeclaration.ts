import { TriggerMemberDeclarationContext } from '@apexdevtools/apex-parser';

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

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

type TriggerMemberDeclarationTypeClassType =
    | MethodDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | ClassDeclarationTypeClass
    | EnumDeclarationTypeClass
    | PropertyDeclarationTypeClass
    | FieldDeclarationTypeClass;

export class TriggerMemberDeclarationTypeClass extends DeclarationTypeClass<
    'triggerMemberDeclaration',
    TriggerMemberDeclarationTypeClassType
> {
    private constructor(value: TriggerMemberDeclarationTypeClassType | ApexErrorTypeClass) {
        super('triggerMemberDeclaration', value);
    }

    static create(ctx: TriggerMemberDeclarationContext): TriggerMemberDeclarationTypeClass {
        if (
            !ctx.methodDeclaration() &&
            !ctx.interfaceDeclaration() &&
            !ctx.classDeclaration() &&
            !ctx.enumDeclaration() &&
            !ctx.propertyDeclaration() &&
            !ctx.fieldDeclaration()
        ) {
            throw new Error('値が異常です。TriggerMemberDeclarationContext: ' + ctx.getText());
        }

        let value: TriggerMemberDeclarationTypeClassType | ApexErrorTypeClass;
        if (ctx.methodDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.methodDeclaration(),
                isMethodDeclarationType,
                'MethodDeclaration',
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

        return new TriggerMemberDeclarationTypeClass(value);
    }
}

export const isTriggerMemberDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is TriggerMemberDeclarationTypeClass => {
    return target instanceof TriggerMemberDeclarationTypeClass;
};
