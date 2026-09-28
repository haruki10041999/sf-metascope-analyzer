import { AnonymousMemberDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

export type AnonymousMemberDeclarationType = {
    type: 'anonymousMemberDeclaration';
    declaration: DeclarationType;
};

export const makeAnonymousMemberDeclarationType = (
    ctx: AnonymousMemberDeclarationContext,
): AnonymousMemberDeclarationType => {
    if (ctx.methodDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.methodDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            declaration: declaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.interfaceDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.interfaceDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            declaration: declaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.classDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.classDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            declaration: declaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.enumDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.enumDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            declaration: declaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.propertyDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.propertyDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            declaration: declaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.fieldDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.fieldDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            declaration: declaration,
        };

        return anonymousMemberDeclarationType;
    }

    throw new Error('値が異常です。AnonymousMemberDeclarationType:' + ctx.getText());
};

