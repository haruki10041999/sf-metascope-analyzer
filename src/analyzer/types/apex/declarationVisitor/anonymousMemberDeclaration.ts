import { AnonymousMemberDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

export type AnonymousMemberDeclarationType = {
    type: 'anonymousMemberDeclaration';
    methodDeclaration?: Omit<DeclarationType, 'type'>;
    interfaceDeclaration?: Omit<DeclarationType, 'type'>;
    classDeclaration?: Omit<DeclarationType, 'type'>;
    enumDeclaration?: Omit<DeclarationType, 'type'>;
    propertyDeclaration?: Omit<DeclarationType, 'type'>;
    fieldDeclaration?: Omit<DeclarationType, 'type'>;
};

export const makeAnonymousMemberDeclarationType = (
    ctx: AnonymousMemberDeclarationContext,
): AnonymousMemberDeclarationType => {
    if (ctx.methodDeclaration()) {
        const { type, ...methodDeclaration } = new DeclarationVisitor().visit(
            ctx.methodDeclaration(),
        );
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            methodDeclaration: methodDeclaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.interfaceDeclaration()) {
        const { type, ...interfaceDeclaration } = new DeclarationVisitor().visit(
            ctx.interfaceDeclaration(),
        );
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            interfaceDeclaration: interfaceDeclaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.classDeclaration()) {
        const { type, ...classDeclaration } = new DeclarationVisitor().visit(
            ctx.classDeclaration(),
        );
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            classDeclaration: classDeclaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.enumDeclaration()) {
        const { type, ...enumDeclaration } = new DeclarationVisitor().visit(ctx.enumDeclaration());
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            enumDeclaration: enumDeclaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.propertyDeclaration()) {
        const { type, ...propertyDeclaration } = new DeclarationVisitor().visit(
            ctx.propertyDeclaration(),
        );
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            propertyDeclaration: propertyDeclaration,
        };

        return anonymousMemberDeclarationType;
    }

    if (ctx.fieldDeclaration()) {
        const { type, ...fieldDeclaration } = new DeclarationVisitor().visit(
            ctx.fieldDeclaration(),
        );
        const anonymousMemberDeclarationType: AnonymousMemberDeclarationType = {
            type: 'anonymousMemberDeclaration',
            fieldDeclaration: fieldDeclaration,
        };

        return anonymousMemberDeclarationType;
    }

    throw new Error('値が異常です。AnonymousMemberDeclarationType:' + ctx.getText());
};
