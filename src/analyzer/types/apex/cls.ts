import { CompilationUnitContext, TypeDeclarationContext } from '@apexdevtools/apex-parser';

import {
    ClassMemberType,
    makeClassMemberType,
    EnumMemberType,
    makeEnumMemberType,
    InterfaceMemberType,
    makeInterfaceMemberType,
} from './member';

import { ModifierField, makeModifierField } from './modifer';

export type ClsField = (ClassMemberType | EnumMemberType | InterfaceMemberType) & {
    modifier?: ModifierField[];
};

export const makeClsField = (ctx: CompilationUnitContext): ClsField => {
    let clsField: ClsField | undefined;
    if (ctx.typeDeclaration().classDeclaration()) {
        clsField = {
            ...makeClassMemberType(ctx.typeDeclaration().classDeclaration()),
        };
    }

    if (ctx.typeDeclaration().interfaceDeclaration()) {
        clsField = {
            ...makeInterfaceMemberType(ctx.typeDeclaration().interfaceDeclaration()),
        };
    }

    if (ctx.typeDeclaration().enumDeclaration()) {
        clsField = {
            ...makeEnumMemberType(ctx.typeDeclaration().enumDeclaration()),
        };
    }

    if (clsField) {
        if (
            ctx.typeDeclaration().modifier_list() &&
            ctx.typeDeclaration().modifier_list().length > 0
        ) {
            clsField.modifier = ctx
                .typeDeclaration()
                .modifier_list()
                .map((modifierCtx) => makeModifierField(modifierCtx));
        }
        return clsField;
    }

    throw new Error('値が異常です。: ' + ctx.getText());
};
