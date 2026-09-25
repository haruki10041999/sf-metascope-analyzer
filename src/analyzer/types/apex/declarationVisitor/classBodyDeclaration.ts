import { ClassBodyDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

import { BlockType, BlockVisitor } from '../blockVisitor';

import { ModifierType, makeModifierType } from '../modifier';

export type ClassBodyDeclarationType = {
    type: 'classBodyDeclaration';
    initializerBlock?: {
        block: Omit<BlockType, 'type'>;
        isStatic: boolean;
    };
    declaration: Omit<DeclarationType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
};

export const makeClassBodyDeclarationType = (
    ctx: ClassBodyDeclarationContext,
): ClassBodyDeclarationType => {
    const { type, ...declaration } = new DeclarationVisitor().visit(ctx.memberDeclaration());

    const classBodyDeclarationType: ClassBodyDeclarationType = {
        type: 'classBodyDeclaration',
        declaration: declaration,
    };

    if (ctx.block()) {
        const { type, ...block } = new BlockVisitor().visit(ctx.block());
        const isStatic = ctx.STATIC() !== undefined;
        classBodyDeclarationType.initializerBlock = {
            block: block,
            isStatic: isStatic,
        };
    }

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        const modifiers = ctx.modifier_list().map((modifierCtx) => {
            const { type, ...modifier } = makeModifierType(modifierCtx);
            return modifier;
        });
        classBodyDeclarationType.modifier = modifiers;
    }

    return classBodyDeclarationType;
};
