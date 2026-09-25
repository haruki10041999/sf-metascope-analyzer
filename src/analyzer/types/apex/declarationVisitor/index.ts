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
} from '@apexdevtools/apex-parser';

import { MemberDeclarationType, makeMemberDeclarationType } from './memberDeclaration';
import {
    TriggerMemberDeclarationType,
    makeTriggerMemberDeclarationType,
} from './triggerMemverDeclaration';
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
    | PropertyDeclarationType;

export class DeclarationVisitor extends ApexParserBaseVisitor<DeclarationType> {
    visitMemberDeclarationContext(ctx: MemberDeclarationContext) {
        return makeMemberDeclarationType(ctx);
    }

    visitLocalVariableDeclarationContext(ctx: LocalVariableDeclarationContext) {
        return makeLocalVariableDeclarationType(ctx);
    }

    visitClassDeclarationContext(ctx: ClassDeclarationContext) {
        return makeClassDeclarationType(ctx);
    }

    visitClassBodyDeclarationContext(ctx: ClassBodyDeclarationContext) {
        return makeClassBodyDeclarationType(ctx);
    }

    visitEnumDeclarationContext(ctx: EnumDeclarationContext) {
        return makeEnumDeclarationType(ctx);
    }

    visitConstructorDeclarationContext(ctx: ConstructorDeclarationContext) {
        return makeConstructorDeclarationType(ctx);
    }

    visitInterfaceMethodDeclarationContext(ctx: InterfaceMethodDeclarationContext) {
        return makeInterfaceMethodDeclarationType(ctx);
    }

    visitInterfaceDeclarationContext(ctx: InterfaceDeclarationContext) {
        return makeInterfaceDeclarationType(ctx);
    }

    visitFieldDeclarationContext(ctx: FieldDeclarationContext) {
        return makeFieldDeclarationType(ctx);
    }

    visitPropertyDeclarationContext(ctx: PropertyDeclarationContext) {
        return makePropertyDeclarationType(ctx);
    }

    visitMethodDeclarationContext(ctx: MethodDeclarationContext) {
        return makeMethodDeclarationType(ctx);
    }

    visitTypeDeclarationContext(ctx: TypeDeclarationContext) {
        return makeTypeDeclarationType(ctx);
    }

    visitTriggerMemberDeclarationContext(ctx: TriggerMemberDeclarationContext) {
        return makeTriggerMemberDeclarationType(ctx);
    }

    visitAnonymousMemberDeclarationContext(ctx: AnonymousMemberDeclarationContext) {
        return makeAnonymousMemberDeclarationType(ctx);
    }
}
