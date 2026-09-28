import { TriggerMemberDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

export type TriggerMemberDeclarationType = {
    type: 'triggerMemberDeclaration';
    declaration: DeclarationType;
};

export const makeTriggerMemberDeclarationType = (
    ctx: TriggerMemberDeclarationContext,
): TriggerMemberDeclarationType => {
    if (ctx.methodDeclaration()) {
        const methodDeclaration = new DeclarationVisitor().visit(ctx.methodDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            declaration: methodDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.interfaceDeclaration()) {
        const interfaceDeclaration = new DeclarationVisitor().visit(ctx.interfaceDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            declaration: interfaceDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.classDeclaration()) {
        const classDeclaration = new DeclarationVisitor().visit(ctx.classDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            declaration: classDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.enumDeclaration()) {
        const enumDeclaration = new DeclarationVisitor().visit(ctx.enumDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            declaration: enumDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.propertyDeclaration()) {
        const propertyDeclaration = new DeclarationVisitor().visit(ctx.propertyDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            declaration: propertyDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    if (ctx.fieldDeclaration()) {
        const fieldDeclaration = new DeclarationVisitor().visit(ctx.fieldDeclaration());
        const triggerMemberDeclarationType: TriggerMemberDeclarationType = {
            type: 'triggerMemberDeclaration',
            declaration: fieldDeclaration,
        };

        return triggerMemberDeclarationType;
    }

    throw new Error('値が異常です。TriggerMemberDeclarationType: ' + ctx.getText());
};

