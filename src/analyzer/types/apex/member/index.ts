import { MemberDeclarationContext } from '@apexdevtools/apex-parser';

import { MethodMemberType, makeMethodMemberType } from './method';
import { ConstructorMemberType, makeConstructorMemberType } from './constructor';
import { InterfaceMemberType, makeInterfaceMemberType } from './interface';
import { ClassMemberType, makeClassMemberType } from './class';
import { EnumMemberType, makeEnumMemberType } from './enum';
import { PropertyMemberType, makePropertyMemberType } from './property';
import { FieldMemberType, makeFieldMemberType } from './field';

export type { InterfaceMemberType } from './interface';
export { makeInterfaceMemberType } from './interface';
export type { ClassMemberType } from './class';
export { makeClassMemberType } from './class';
export type { EnumMemberType } from './enum';
export { makeEnumMemberType } from './enum';

export type MemberField =
    | MethodMemberType
    | ConstructorMemberType
    | InterfaceMemberType
    | ClassMemberType
    | EnumMemberType
    | PropertyMemberType
    | FieldMemberType;

export const makeMemberField = (ctx: MemberDeclarationContext): MemberField => {
    if (ctx.classDeclaration()) {
        return makeClassMemberType(ctx.classDeclaration());
    }

    if (ctx.interfaceDeclaration()) {
        return makeInterfaceMemberType(ctx.interfaceDeclaration());
    }

    if (ctx.enumDeclaration()) {
        return makeEnumMemberType(ctx.enumDeclaration());
    }

    if (ctx.methodDeclaration()) {
        return makeMethodMemberType(ctx.methodDeclaration());
    }

    if (ctx.constructorDeclaration()) {
        return makeConstructorMemberType(ctx.constructorDeclaration());
    }

    if (ctx.propertyDeclaration()) {
        return makePropertyMemberType(ctx.propertyDeclaration());
    }

    if (ctx.fieldDeclaration()) {
        return makeFieldMemberType(ctx.fieldDeclaration());
    }

    throw new Error('値が以上です。: ' + ctx.getText());
};
