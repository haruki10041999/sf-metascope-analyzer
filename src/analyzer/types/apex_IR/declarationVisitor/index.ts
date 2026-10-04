import {
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
import { FieldDeclarationTypeClass } from './fieldDeclaration';
import { PropertyDeclarationTypeClass } from './propertyDeclaration';
import { InterfaceMethodDeclarationTypeClass } from './interfaceMethodDeclaration';
import { InterfaceDeclarationType, makeInterfaceDeclarationType } from './interfaceDeclaration';
import { LocalVariableDeclarationTypeClass } from './localVariableDeclaration';
import { ClassDeclarationTypeClass } from './classDeclaration';
import { ClassBodyDeclarationType, makeClassBodyDeclarationType } from './classBodyDeclaration';
import { MethodDeclarationTypeClass } from './methodDeclaration';
import { EnumDeclarationTypeClass } from './enumDeclaration';
import { ConstructorDeclarationTypeClass } from './constructorDeclaration';
import { EnumConstantsTypeClass } from './enumConstants';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isFieldDeclarationType, FieldDeclarationTypeClass } from './fieldDeclaration';
export {
    isPropertyDeclarationTypeClass,
    PropertyDeclarationTypeClass,
} from './propertyDeclaration';
export {
    isInterfaceMethodDeclarationType,
    InterfaceMethodDeclarationTypeClass,
} from './interfaceMethodDeclaration';
export { isClassDeclarationType, ClassDeclarationTypeClass } from './classDeclaration';
export { isMethodDeclarationType, MethodDeclarationTypeClass } from './methodDeclaration';
export { isEnumDeclarationType, EnumDeclarationTypeClass } from './enumDeclaration';
export {
    isLocalVariableDeclarationType,
    LocalVariableDeclarationTypeClass,
} from './localVariableDeclaration';
export {
    isConstructorDeclarationType,
    ConstructorDeclarationTypeClass,
} from './constructorDeclaration';
export { isEnumConstantsType, EnumConstantsTypeClass } from './enumConstants';

export class DeclarationTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isDeclarationTypeAll = (
    target: CommonTypeClass,
): target is DeclarationTypeClass<unknown> => {
    return target instanceof DeclarationTypeClass;
};

export class DeclarationVisitor extends CommonVisitor<DeclarationTypeClass<unknown>> {
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
        return LocalVariableDeclarationTypeClass.create(ctx);
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
        return EnumDeclarationTypeClass.create(ctx);
    }

    visitConstructorDeclaration(ctx: ConstructorDeclarationContext) {
        return ConstructorDeclarationTypeClass.create(ctx);
    }

    visitInterfaceMethodDeclaration(ctx: InterfaceMethodDeclarationContext) {
        return InterfaceMethodDeclarationTypeClass.create(ctx);
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
        return FieldDeclarationTypeClass.create(ctx);
    }

    visitPropertyDeclaration(ctx: PropertyDeclarationContext) {
        return PropertyDeclarationTypeClass.create(ctx);
    }

    visitMethodDeclaration(ctx: MethodDeclarationContext) {
        return MethodDeclarationTypeClass.create(ctx);
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
        return EnumConstantsTypeClass.create(ctx);
    }
}
