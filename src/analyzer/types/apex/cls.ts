import { CompilationUnitContext, TypeDeclarationContext } from '@apexdevtools/apex-parser';

import { MemberType, MemberVisitor } from './memberVisitor';

import { ModifierField, makeModifierField } from './modifer';

export type ClsField = MemberType & {
    modifier?: ModifierField[];
};

export const makeClsField = (ctx: CompilationUnitContext): ClsField => {
    let clsField: ClsField | undefined;
    if (ctx.typeDeclaration().classDeclaration()) {
        clsField = new MemberVisitor().visit(ctx.typeDeclaration().classDeclaration());
    }

    if (ctx.typeDeclaration().interfaceDeclaration()) {
        clsField = new MemberVisitor().visit(ctx.typeDeclaration().interfaceDeclaration());
    }

    if (ctx.typeDeclaration().enumDeclaration()) {
        clsField = new MemberVisitor().visit(ctx.typeDeclaration().enumDeclaration());
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
