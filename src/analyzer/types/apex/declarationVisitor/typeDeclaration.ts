import { TypeDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

import { ModifierType, makeModifierType } from '../modifier';

export type TypeDeclarationType = {
    type: 'typeDeclaration';
    classDeclaration?: Omit<DeclarationType, 'type'>;
    enumDeclaration?: Omit<DeclarationType, 'type'>;
    interfaceDeclaration?: Omit<DeclarationType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
};

export const makeTypeDeclarationType = (ctx: TypeDeclarationContext): TypeDeclarationType => {
    let modifiers;
    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        modifiers = ctx.modifier_list().map((modifierCtx) => {
            const { type, ...modifier } = makeModifierType(modifierCtx);
            return modifier;
        });
    }

    if (ctx.classDeclaration()) {
        const { type, ...classDeclaration } = new DeclarationVisitor().visit(
            ctx.classDeclaration(),
        );
        const typeDeclarationType: TypeDeclarationType = {
            type: 'typeDeclaration',
            classDeclaration: classDeclaration,
        };

        if (modifiers) {
            typeDeclarationType.modifier = modifiers;
        }

        return typeDeclarationType;
    }

    if (ctx.enumDeclaration()) {
        const { type, ...enumDeclaration } = new DeclarationVisitor().visit(ctx.enumDeclaration());
        const typeDeclarationType: TypeDeclarationType = {
            type: 'typeDeclaration',
            enumDeclaration: enumDeclaration,
        };

        if (modifiers) {
            typeDeclarationType.modifier = modifiers;
        }

        return typeDeclarationType;
    }

    if (ctx.interfaceDeclaration()) {
        const { type, ...interfaceDeclaration } = new DeclarationVisitor().visit(
            ctx.interfaceDeclaration(),
        );
        const typeDeclarationType: TypeDeclarationType = {
            type: 'typeDeclaration',
            interfaceDeclaration: interfaceDeclaration,
        };

        if (modifiers) {
            typeDeclarationType.modifier = modifiers;
        }

        return typeDeclarationType;
    }

    throw new Error('値が異常です。TypeDeclarationType: ' + ctx.getText());
};
