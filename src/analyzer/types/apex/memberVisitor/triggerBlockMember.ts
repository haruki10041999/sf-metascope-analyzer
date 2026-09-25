import { TriggerBlockMemberContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';
import { StatementType, StatementVisitor } from '../statementVisitor';

import { ModifierType, makeModifierType } from '../modifier';

export type TriggerBlockMemberType = {
    type: 'triggerBlockMember';
    declaration?: Omit<DeclarationType, 'type'>;
    statement?: Omit<StatementType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
};

export const makeTriggerBlockMemberType = (
    ctx: TriggerBlockMemberContext,
): TriggerBlockMemberType => {
    if (ctx.triggerMemberDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(
            ctx.triggerMemberDeclaration(),
        );

        const triggerBlockMemberType: TriggerBlockMemberType = {
            type: 'triggerBlockMember',
            declaration: declaration,
        };

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            const modifiers = ctx.modifier_list().map((modifierCtx) => {
                const { type: _, ...modifier } = makeModifierType(modifierCtx);
                return modifier;
            });
            triggerBlockMemberType.modifier = modifiers;
        }
        return triggerBlockMemberType;
    }

    if (ctx.statement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.statement());
        return {
            type: 'triggerBlockMember',
            statement: statement,
        };
    }

    throw new Error('値が異常です。TriggerBlockMemberContext: ' + ctx.getText());
};
