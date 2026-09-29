import { AnonymousBlockMemberContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';
import { StatementType, StatementVisitor } from '../statementVisitor';
import { ModifierType, ModifierVisitor } from '../modifierVisitor';

export type AnonymousBlockMemberType = {
    type: 'anonymousBlockMember';
    member:
        | {
              declaration: DeclarationType;
              modifier?: ModifierType[];
          }
        | StatementType;
};

export const makeAnonymousBlockMemberType = (
    ctx: AnonymousBlockMemberContext,
): AnonymousBlockMemberType => {
    if (ctx.anonymousMemberDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.anonymousMemberDeclaration());

        const member: {
            declaration: DeclarationType;
            modifier?: ModifierType[];
        } = {
            declaration: declaration,
        };

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            const modifiers = ctx.modifier_list().map((modifierCtx) => {
                const modifier = new ModifierVisitor().visit(modifierCtx);
                return modifier;
            });
            member.modifier = modifiers;
        }
        return {
            type: 'anonymousBlockMember',
            member: member,
        };
    }

    if (ctx.statement()) {
        const statement = new StatementVisitor().visit(ctx.statement());
        return {
            type: 'anonymousBlockMember',
            member: statement,
        };
    }

    throw new Error('値が異常です。AnonymousBlockMemberContext: ' + ctx.getText());
};

