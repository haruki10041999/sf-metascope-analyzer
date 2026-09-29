import { TriggerBlockMemberContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';
import { StatementType, StatementVisitor } from '../statementVisitor';
import { ModifierType, ModifierVisitor } from '../modifierVisitor';

export type TriggerBlockMemberType = {
    type: 'triggerBlockMember';
    member:
        | {
              declaration: DeclarationType;
              modifier?: ModifierType[];
          }
        | StatementType;
};

export const makeTriggerBlockMemberType = (
    ctx: TriggerBlockMemberContext,
): TriggerBlockMemberType => {
    if (ctx.triggerMemberDeclaration()) {
        const declaration = new DeclarationVisitor().visit(ctx.triggerMemberDeclaration());

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
            type: 'triggerBlockMember',
            member: member,
        };
    }

    if (ctx.statement()) {
        const statement = new StatementVisitor().visit(ctx.statement());
        return {
            type: 'triggerBlockMember',
            member: statement,
        };
    }

    throw new Error('値が異常です。TriggerBlockMemberContext: ' + ctx.getText());
};

