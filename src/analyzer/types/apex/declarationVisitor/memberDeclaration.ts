import { MemberDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

export type MemberDeclarationType = {
    type: 'memberDeclaration';
    declaration: Omit<DeclarationType, 'type'>;
};

export const makeMemberDeclarationType = (ctx: MemberDeclarationContext): MemberDeclarationType => {
    if (ctx.methodDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(ctx.methodDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.constructorDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(
            ctx.constructorDeclaration(),
        );
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.interfaceDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(ctx.interfaceDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.classDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(ctx.classDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.enumDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(ctx.enumDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.propertyDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(ctx.propertyDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    if (ctx.fieldDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(ctx.fieldDeclaration());
        return {
            type: 'memberDeclaration',
            declaration: declaration,
        };
    }

    throw new Error('値が異常です。MemberDeclarationContext: ' + ctx.getText());
};
