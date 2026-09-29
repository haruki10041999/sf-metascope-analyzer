import { ClassBodyDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '.';

import { BlockType, BlockVisitor } from '../blockVisitor';

import { ModifierType, ModifierVisitor } from '../modifierVisitor';

export type ClassBodyDeclarationType = {
    type: 'classBodyDeclaration';
    declaration:
        | {
              body: DeclarationType;
              modifier?: ModifierType[];
          }
        | {
              body: BlockType;
              isStatic: boolean;
          };
};

export const makeClassBodyDeclarationType = (
    ctx: ClassBodyDeclarationContext,
): ClassBodyDeclarationType => {
    if (ctx.block()) {
        const block = new BlockVisitor().visit(ctx.block());
        const isStatic = Boolean(ctx.STATIC());
        return {
            type: 'classBodyDeclaration',
            declaration: {
                body: block,
                isStatic: isStatic,
            },
        };
    }

    if (ctx.memberDeclaration()) {
        const body = new DeclarationVisitor().visit(ctx.memberDeclaration());

        const declaration: {
            body: DeclarationType;
            modifier?: ModifierType[];
        } = {
            body: body,
        };

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            const modifiers = ctx.modifier_list().map((modifierCtx) => {
                const modifier = new ModifierVisitor().visit(modifierCtx);
                return modifier;
            });
            declaration.modifier = modifiers;
        }

        return {
            type: 'classBodyDeclaration',
            declaration: declaration,
        };
    }

    throw new Error('値が異常です。ClassBodyDeclarationContext: ' + ctx.getText());
};
