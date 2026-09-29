import { TypeDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';
import { ModifierType, ModifierVisitor } from '../modifierVisitor';

export type TypeDeclarationType = {
    type: 'typeDeclaration';
    declaration: {
        declaration: DeclarationType;
        modifier?: ModifierType[];
    };
};

export const makeTypeDeclarationType = (ctx: TypeDeclarationContext): TypeDeclarationType => {
    let modifiers;
    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        modifiers = ctx.modifier_list().map((modifierCtx) => {
            const modifier = new ModifierVisitor().visit(modifierCtx);
            return modifier;
        });
    }

    if (ctx.classDeclaration()) {
        const classDeclaration = new DeclarationVisitor().visit(ctx.classDeclaration());
        const typeDeclarationType: TypeDeclarationType = {
            type: 'typeDeclaration',
            declaration: {
                declaration: classDeclaration,
            },
        };

        if (modifiers) {
            typeDeclarationType.declaration.modifier = modifiers;
        }

        return typeDeclarationType;
    }

    if (ctx.enumDeclaration()) {
        const enumDeclaration = new DeclarationVisitor().visit(ctx.enumDeclaration());
        const typeDeclarationType: TypeDeclarationType = {
            type: 'typeDeclaration',
            declaration: {
                declaration: enumDeclaration,
            },
        };

        if (modifiers) {
            typeDeclarationType.declaration.modifier = modifiers;
        }

        return typeDeclarationType;
    }

    if (ctx.interfaceDeclaration()) {
        const interfaceDeclaration = new DeclarationVisitor().visit(ctx.interfaceDeclaration());
        const typeDeclarationType: TypeDeclarationType = {
            type: 'typeDeclaration',
            declaration: {
                declaration: interfaceDeclaration,
            },
        };

        if (modifiers) {
            typeDeclarationType.declaration.modifier = modifiers;
        }

        return typeDeclarationType;
    }

    throw new Error('値が異常です。TypeDeclarationType: ' + ctx.getText());
};

