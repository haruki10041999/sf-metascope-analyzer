import { ClassBodyDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

import { BlockType, BlockVisitor } from '../blockVisitor';

import { ModifierType, ModifierVisitor } from '../modifierVisitor';

export type ClassBodyDeclarationType = {
    type: 'classBodyDeclaration';
    declaration: {
        body: DeclarationType;
        initializerBlock?: {
            block: BlockType;
            isStatic: boolean;
        };
        modifier?: ModifierType[];
    };
};

export const makeClassBodyDeclarationType = (
    ctx: ClassBodyDeclarationContext,
): ClassBodyDeclarationType => {
    const declaration = new DeclarationVisitor().visit(ctx.memberDeclaration());

    const classBodyDeclarationType: ClassBodyDeclarationType = {
        type: 'classBodyDeclaration',
        declaration: {
            body: declaration,
        },
    };

    if (ctx.block()) {
        const block = new BlockVisitor().visit(ctx.block());
        const isStatic = ctx.STATIC() !== undefined;
        classBodyDeclarationType.declaration.initializerBlock = {
            block: block,
            isStatic: isStatic,
        };
    }

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        const modifiers = ctx.modifier_list().map((modifierCtx) => {
            const modifier = new ModifierVisitor().visit(modifierCtx);
            return modifier;
        });
        classBodyDeclarationType.declaration.modifier = modifiers;
    }

    return classBodyDeclarationType;
};
