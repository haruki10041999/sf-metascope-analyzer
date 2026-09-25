import {
    ApexParserBaseVisitor,
    MemberDeclarationContext,
    ClassDeclarationContext,
    ClassBodyDeclarationContext,
    EnumDeclarationContext,
    ConstructorDeclarationContext,
    LocalVariableDeclarationContext,
    FieldDeclarationContext,
    InterfaceMethodDeclarationContext,
    InterfaceDeclarationContext,
    PropertyDeclarationContext,
} from '@apexdevtools/apex-parser';

import { MemberDeclarationType, makeMemberDeclarationType } from './memberDeclaration';
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
import { EnumDeclarationType, makeEnumDeclarationType } from './enumDeclaration';
import {
    ConstructorDeclarationType,
    makeConstructorDeclarationType,
} from './constructorDeclaration';

export type DeclarationType =
    | LocalVariableDeclarationType
    | MemberDeclarationType
    | ClassDeclarationType
    | ClassBodyDeclarationType
    | EnumDeclarationType
    | ConstructorDeclarationType
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
}
