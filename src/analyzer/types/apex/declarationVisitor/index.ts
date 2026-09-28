import {
    ApexParserBaseVisitor,
    MemberDeclarationContext,
    TriggerMemberDeclarationContext,
    AnonymousMemberDeclarationContext,
    TypeDeclarationContext,
    ClassDeclarationContext,
    ClassBodyDeclarationContext,
    EnumDeclarationContext,
    ConstructorDeclarationContext,
    MethodDeclarationContext,
    LocalVariableDeclarationContext,
    FieldDeclarationContext,
    InterfaceMethodDeclarationContext,
    InterfaceDeclarationContext,
    PropertyDeclarationContext,
    EnumConstantsContext,
} from '@apexdevtools/apex-parser';

import { MemberDeclarationType, makeMemberDeclarationType } from './memberDeclaration';
import {
    TriggerMemberDeclarationType,
    makeTriggerMemberDeclarationType,
} from './triggerMemberDeclaration';
import {
    AnonymousMemberDeclarationType,
    makeAnonymousMemberDeclarationType,
} from './anonymousMemberDeclaration';
import { TypeDeclarationType, makeTypeDeclarationType } from './typeDeclaration';
import { FieldDeclarationType, makeFieldDeclarationType } from './fieldDeclaration';
import { PropertyDeclarationType, makePropertyDeclarationType } from './propertyDeclaration';
import {
    InterfaceMethodDeclarationType,
    makeInterfaceMethodDeclarationType,
} from './interfaceMethodDeclaration';
import { InterfaceDeclarationType, makeInterfaceDeclarationType } from './interfaceDeclaration';
import {
    LocalVariableDeclarationType,
    makeLocalVariableDeclarationType,
} from './localVariableDeclaration';
import { ClassDeclarationType, makeClassDeclarationType } from './classDeclaration';
import { ClassBodyDeclarationType, makeClassBodyDeclarationType } from './classBodyDeclaration';
import { MethodDeclarationType, makeMethodDeclarationType } from './methodDeclaration';
import { EnumDeclarationType, makeEnumDeclarationType } from './enumDeclaration';
import {
    ConstructorDeclarationType,
    makeConstructorDeclarationType,
} from './constructorDeclaration';
import { EnumConstantsType, makeEnumConstantsType } from './enumConstants';

export type DeclarationType =
    | LocalVariableDeclarationType
    | MemberDeclarationType
    | TriggerMemberDeclarationType
    | AnonymousMemberDeclarationType
    | TypeDeclarationType
    | ClassDeclarationType
    | ClassBodyDeclarationType
    | EnumDeclarationType
    | ConstructorDeclarationType
    | MethodDeclarationType
    | FieldDeclarationType
    | InterfaceMethodDeclarationType
    | InterfaceDeclarationType
    | PropertyDeclarationType
    | EnumConstantsType;

export class DeclarationVisitor extends ApexParserBaseVisitor<DeclarationType> {
    visitMemberDeclaration(ctx: MemberDeclarationContext) {
        return makeMemberDeclarationType(ctx);
    }

    visitLocalVariableDeclaration(ctx: LocalVariableDeclarationContext) {
        return makeLocalVariableDeclarationType(ctx);
    }

    visitClassDeclaration(ctx: ClassDeclarationContext) {
        return makeClassDeclarationType(ctx);
    }

    visitClassBodyDeclaration(ctx: ClassBodyDeclarationContext) {
        return makeClassBodyDeclarationType(ctx);
    }

    visitEnumDeclaration(ctx: EnumDeclarationContext) {
        return makeEnumDeclarationType(ctx);
    }

    visitConstructorDeclaration(ctx: ConstructorDeclarationContext) {
        return makeConstructorDeclarationType(ctx);
    }

    visitInterfaceMethodDeclaration(ctx: InterfaceMethodDeclarationContext) {
        return makeInterfaceMethodDeclarationType(ctx);
    }

    visitInterfaceDeclaration(ctx: InterfaceDeclarationContext) {
        return makeInterfaceDeclarationType(ctx);
    }

    visitFieldDeclaration(ctx: FieldDeclarationContext) {
        return makeFieldDeclarationType(ctx);
    }

    visitPropertyDeclaration(ctx: PropertyDeclarationContext) {
        return makePropertyDeclarationType(ctx);
    }

    visitMethodDeclaration(ctx: MethodDeclarationContext) {
        return makeMethodDeclarationType(ctx);
    }

    visitTypeDeclaration(ctx: TypeDeclarationContext) {
        return makeTypeDeclarationType(ctx);
    }

    visitTriggerMemberDeclaration(ctx: TriggerMemberDeclarationContext) {
        return makeTriggerMemberDeclarationType(ctx);
    }

    visitAnonymousMemberDeclaration(ctx: AnonymousMemberDeclarationContext) {
        return makeAnonymousMemberDeclarationType(ctx);
    }

    visitEnumConstants(ctx: EnumConstantsContext) {
        return makeEnumConstantsType(ctx);
    }
}
