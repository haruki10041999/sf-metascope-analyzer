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

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { DeclarationAllTypeClass } from './base';

import { MemberDeclarationTypeClass } from './memberDeclaration';
import { TriggerMemberDeclarationTypeClass } from './triggerMemberDeclaration';
import { AnonymousMemberDeclarationTypeClass } from './anonymousMemberDeclaration';
import { TypeDeclarationTypeClass } from './typeDeclaration';
import { FieldDeclarationTypeClass } from './fieldDeclaration';
import { PropertyDeclarationTypeClass } from './propertyDeclaration';
import { InterfaceMethodDeclarationTypeClass } from './interfaceMethodDeclaration';
import { InterfaceDeclarationTypeClass } from './interfaceDeclaration';
import { LocalVariableDeclarationTypeClass } from './localVariableDeclaration';
import { ClassDeclarationTypeClass } from './classDeclaration';
import { ClassBodyDeclarationTypeClass } from './classBodyDeclaration';
import { MethodDeclarationTypeClass } from './methodDeclaration';
import { EnumDeclarationTypeClass } from './enumDeclaration';
import { ConstructorDeclarationTypeClass } from './constructorDeclaration';
import { EnumConstantsTypeClass } from './enumConstants';

import { CommonVisitor } from '../commonVisitor';

export { isTypeDeclarationType, TypeDeclarationTypeClass } from './typeDeclaration';
export { isMemberDeclarationType, MemberDeclarationTypeClass } from './memberDeclaration';
export { isFieldDeclarationType, FieldDeclarationTypeClass } from './fieldDeclaration';
export { isPropertyDeclarationType, PropertyDeclarationTypeClass } from './propertyDeclaration';
export {
    isInterfaceMethodDeclarationType,
    InterfaceMethodDeclarationTypeClass,
} from './interfaceMethodDeclaration';
export { isInterfaceDeclarationType, InterfaceDeclarationTypeClass } from './interfaceDeclaration';
export { isClassDeclarationType, ClassDeclarationTypeClass } from './classDeclaration';
export { isMethodDeclarationType, MethodDeclarationTypeClass } from './methodDeclaration';
export { isEnumDeclarationType, EnumDeclarationTypeClass } from './enumDeclaration';
export {
    isLocalVariableDeclarationType,
    LocalVariableDeclarationTypeClass,
} from './localVariableDeclaration';
export { isClassBodyDeclarationType, ClassBodyDeclarationTypeClass } from './classBodyDeclaration';
export {
    isConstructorDeclarationType,
    ConstructorDeclarationTypeClass,
} from './constructorDeclaration';
export { isEnumConstantsType, EnumConstantsTypeClass } from './enumConstants';
export {
    isTriggerMemberDeclarationType,
    TriggerMemberDeclarationTypeClass,
} from './triggerMemberDeclaration';
export {
    isAnonymousMemberDeclarationType,
    AnonymousMemberDeclarationTypeClass,
} from './anonymousMemberDeclaration';

export class DeclarationVisitor extends CommonVisitor<DeclarationAllTypeClass> {
    visitMemberDeclaration(ctx: MemberDeclarationContext) {
        return MemberDeclarationTypeClass.create(ctx);
    }

    visitLocalVariableDeclaration(ctx: LocalVariableDeclarationContext) {
        return LocalVariableDeclarationTypeClass.create(ctx);
    }

    visitClassDeclaration(ctx: ClassDeclarationContext) {
        return ClassDeclarationTypeClass.create(ctx);
    }

    visitClassBodyDeclaration(ctx: ClassBodyDeclarationContext) {
        return ClassBodyDeclarationTypeClass.create(ctx);
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
        return InterfaceDeclarationTypeClass.create(ctx);
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
        return TypeDeclarationTypeClass.create(ctx);
    }

    visitTriggerMemberDeclaration(ctx: TriggerMemberDeclarationContext) {
        return TriggerMemberDeclarationTypeClass.create(ctx);
    }

    visitAnonymousMemberDeclaration(ctx: AnonymousMemberDeclarationContext) {
        return AnonymousMemberDeclarationTypeClass.create(ctx);
    }

    visitEnumConstants(ctx: EnumConstantsContext) {
        return EnumConstantsTypeClass.create(ctx);
    }
}
