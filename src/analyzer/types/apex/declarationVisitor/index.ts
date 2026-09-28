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
        console.log('解析を開始します。' + 'MemberDeclarationContext:  ' + ctx.getText());
        const result = makeMemberDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MemberDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLocalVariableDeclaration(ctx: LocalVariableDeclarationContext) {
        console.log('解析を開始します。' + 'LocalVariableDeclarationContext:  ' + ctx.getText());
        const result = makeLocalVariableDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LocalVariableDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitClassDeclaration(ctx: ClassDeclarationContext) {
        console.log('解析を開始します。' + 'ClassDeclarationContext:  ' + ctx.getText());
        const result = makeClassDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ClassDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitClassBodyDeclaration(ctx: ClassBodyDeclarationContext) {
        console.log('解析を開始します。' + 'ClassBodyDeclarationContext:  ' + ctx.getText());
        const result = makeClassBodyDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ClassBodyDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitEnumDeclaration(ctx: EnumDeclarationContext) {
        console.log('解析を開始します。' + 'EnumDeclarationContext:  ' + ctx.getText());
        const result = makeEnumDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'EnumDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitConstructorDeclaration(ctx: ConstructorDeclarationContext) {
        console.log('解析を開始します。' + 'ConstructorDeclarationContext:  ' + ctx.getText());
        const result = makeConstructorDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ConstructorDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitInterfaceMethodDeclaration(ctx: InterfaceMethodDeclarationContext) {
        console.log('解析を開始します。' + 'InterfaceMethodDeclarationContext:  ' + ctx.getText());
        const result = makeInterfaceMethodDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'InterfaceMethodDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitInterfaceDeclaration(ctx: InterfaceDeclarationContext) {
        console.log('解析を開始します。' + 'InterfaceDeclarationContext:  ' + ctx.getText());
        const result = makeInterfaceDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'InterfaceDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldDeclaration(ctx: FieldDeclarationContext) {
        console.log('解析を開始します。' + 'FieldDeclarationContext:  ' + ctx.getText());
        const result = makeFieldDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitPropertyDeclaration(ctx: PropertyDeclarationContext) {
        console.log('解析を開始します。' + 'PropertyDeclarationContext:  ' + ctx.getText());
        const result = makePropertyDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'PropertyDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitMethodDeclaration(ctx: MethodDeclarationContext) {
        console.log('解析を開始します。' + 'MethodDeclarationContext:  ' + ctx.getText());
        const result = makeMethodDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MethodDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTypeDeclaration(ctx: TypeDeclarationContext) {
        console.log('解析を開始します。' + 'TypeDeclarationContext:  ' + ctx.getText());
        const result = makeTypeDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTriggerMemberDeclaration(ctx: TriggerMemberDeclarationContext) {
        console.log('解析を開始します。' + 'TriggerMemberDeclarationContext:  ' + ctx.getText());
        const result = makeTriggerMemberDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TriggerMemberDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAnonymousMemberDeclaration(ctx: AnonymousMemberDeclarationContext) {
        console.log('解析を開始します。' + 'AnonymousMemberDeclarationContext:  ' + ctx.getText());
        const result = makeAnonymousMemberDeclarationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AnonymousMemberDeclarationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitEnumConstants(ctx: EnumConstantsContext) {
        console.log('解析を開始します。' + 'EnumConstantsContext:  ' + ctx.getText());
        const result = makeEnumConstantsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'EnumConstantsContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
