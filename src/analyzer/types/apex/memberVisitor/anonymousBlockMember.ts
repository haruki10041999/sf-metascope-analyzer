import { AnonymousBlockMemberContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';
import { StatementType, StatementVisitor } from '../statementVisitor';

import { ModifierType, makeModifierType } from '../modifier';

export type AnonymousBlockMemberType = {
    type: 'anonymousBlockMemger';
    declaration?: Omit<DeclarationType, 'type'>;
    statement?: Omit<StatementType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
};

export const makeAnonymousBlockMemberType = (
    ctx: AnonymousBlockMemberContext,
): AnonymousBlockMemberType => {
    if (ctx.anonymousMemberDeclaration()) {
        const { type, ...declaration } = new DeclarationVisitor().visit(
            ctx.anonymousMemberDeclaration(),
        );

        const anonymousBlockMemberType: AnonymousBlockMemberType = {
            type: 'anonymousBlockMemger',
            declaration: declaration,
        };

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            const modifiers = ctx.modifier_list().map((modifierCtx) => {
                const { type: _, ...modifier } = makeModifierType(modifierCtx);
                return modifier;
            });
            anonymousBlockMemberType.modifier = modifiers;
        }
        return anonymousBlockMemberType;
    }

    if (ctx.statement()) {
        const { type, ...statement } = new StatementVisitor().visit(ctx.statement());
        return {
            type: 'anonymousBlockMemger',
            statement: statement,
        };
    }

    throw new Error('値が異常です。AnonymousBlockMemberContext: ' + ctx.getText());
};
