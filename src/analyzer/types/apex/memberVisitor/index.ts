import {
    ApexParserBaseVisitor,
    MethodDeclarationContext,
    ConstructorDeclarationContext,
    InterfaceDeclarationContext,
    ClassDeclarationContext,
    EnumDeclarationContext,
    PropertyDeclarationContext,
    FieldDeclarationContext,
} from '@apexdevtools/apex-parser';

import { MethodMemberType, makeMethodMemberType } from './method';
import { ConstructorMemberType, makeConstructorMemberType } from './constructor';
import { InterfaceMemberType, makeInterfaceMemberType } from './interface';
import { ClassMemberType, makeClassMemberType } from './class';
import { EnumMemberType, makeEnumMemberType } from './enum';
import { PropertyMemberType, makePropertyMemberType } from './property';
import { FieldMemberType, makeFieldMemberType } from './field';

export type MemberType =
    | MethodMemberType
    | ConstructorMemberType
    | InterfaceMemberType
    | ClassMemberType
    | EnumMemberType
    | PropertyMemberType
    | FieldMemberType;

export class MemberVisitor extends ApexParserBaseVisitor<MemberType> {
    visitMethodDeclarationContext(ctx: MethodDeclarationContext) {
        return makeMethodMemberType(ctx);
    }

    visitConstructorDeclarationContext(ctx: ConstructorDeclarationContext) {
        return makeConstructorMemberType(ctx);
    }

    visitInterfaceDeclarationContext(ctx: InterfaceDeclarationContext) {
        return makeInterfaceMemberType(ctx);
    }

    visitClassDeclarationContext(ctx: ClassDeclarationContext) {
        return makeClassMemberType(ctx);
    }

    visitEnumDeclarationContext(ctx: EnumDeclarationContext) {
        return makeEnumMemberType(ctx);
    }

    visitPropertyDeclarationContext(ctx: PropertyDeclarationContext) {
        return makePropertyMemberType(ctx);
    }

    visitFieldDeclarationContext(ctx: FieldDeclarationContext) {
        return makeFieldMemberType(ctx);
    }
}
