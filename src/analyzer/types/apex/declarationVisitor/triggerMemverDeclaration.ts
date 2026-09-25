import { TriggerMemberDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

export type TriggerMemberDeclarationType = {
    type: 'triggerMemberDeclaration';
    methodDeclaration?: Omit<DeclarationType, 'type'>;
    interfaceDeclaration?: Omit<DeclarationType, 'type'>;
    classDeclaration?: Omit<DeclarationType, 'type'>;
    enumDeclaration?: Omit<DeclarationType, 'type'>;
    propertyDeclaration?: Omit<DeclarationType, 'type'>;
    fieldDeclaration?: Omit<DeclarationType, 'type'>;
};

export const makeTriggerMemberDeclarationType = (
    ctx: TriggerMemberDeclarationContext,
): TriggerMemberDeclarationType => {
    if (ctx.methodDeclaration()) {
        const { type, ...methodDeclaration } = new DeclarationVisitor().visit(
            ctx.methodDeclaration(),
        );
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            methodDeclaration: methodDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.interfaceDeclaration()) {
        const { type, ...interfaceDeclaration } = new DeclarationVisitor().visit(
            ctx.interfaceDeclaration(),
        );
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            interfaceDeclaration: interfaceDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.classDeclaration()) {
        const { type, ...classDeclaration } = new DeclarationVisitor().visit(
            ctx.classDeclaration(),
        );
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            classDeclaration: classDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.enumDeclaration()) {
        const { type, ...enumDeclaration } = new DeclarationVisitor().visit(ctx.enumDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            enumDeclaration: enumDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.propertyDeclaration()) {
        const { type, ...propertyDeclaration } = new DeclarationVisitor().visit(
            ctx.propertyDeclaration(),
        );
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            propertyDeclaration: propertyDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.fieldDeclaration()) {
        const { type, ...fieldDeclaration } = new DeclarationVisitor().visit(
            ctx.fieldDeclaration(),
        );
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            fieldDeclaration: fieldDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    throw new Error('値が異常です。TriggerMemberDeclarationType: ' + ctx.getText());
};
