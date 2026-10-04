import { MemberDeclarationContext } from '@apexdevtools/apex-parser';

import { MethodDeclarationTypeClass, ConstructorDeclarationTypeClass, Interface } from '.';

import { DeclarationType, DeclarationVisitor } from '.';

export type MemberDeclarationType = {
    type: 'memberDeclaration';
    declaration: DeclarationType;
};

export const makeMemberDeclarationType = (ctx: MemberDeclarationContext): MemberDeclarationType => {
    if (ctx.methodDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.methodDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.constructorDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.constructorDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.interfaceDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.interfaceDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.classDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.classDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.enumDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.enumDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.propertyDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.propertyDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.fieldDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.fieldDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    throw new Error('値が異常です。MemberDeclarationContext: ' + ctx.getText());
};
