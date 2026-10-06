import { TriggerBlockMemberContext } from '@apexdevtools/apex-parser';

import { MemberTypeClass } from '.';

import {
    TriggerMemberDeclarationTypeClass,
    DeclarationVisitor,
    isTriggerMemberDeclarationType,
} from '../declarationVisitor';
import {
    NormalStatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '../statementVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class TriggerBlockMemberTypeClass extends MemberTypeClass<
    TriggerMemberDeclarationTypeClass | NormalStatementTypeClass
> {
    private constructor(
        value: TriggerMemberDeclarationTypeClass | NormalStatementTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
    ) {
        super('triggerBlockMember', value, modifier);
    }

    static create(ctx: TriggerBlockMemberContext): TriggerBlockMemberTypeClass {
        if (!ctx.triggerMemberDeclaration() && !ctx.statement()) {
            throw new Error('値が異常です。TriggerBlockMemberContext: ' + ctx.getText());
        }

        return new TriggerBlockMemberTypeClass(
            ctx.triggerMemberDeclaration()
                ? isValidClass(
                      new DeclarationVisitor().visit(ctx.triggerMemberDeclaration()),
                      isTriggerMemberDeclarationType,
                      'triggerMemberDeclaration',
                  )
                : isValidClass(
                      new StatementVisitor().visit(ctx.statement()),
                      isNormalStatementType,
                      'statement',
                  ),
            isValidClassList(
                ctx.modifier_list(),
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }
}

export const isTriggerBlockMemberType = (
    target: CommonTypeClass,
): target is TriggerBlockMemberTypeClass => {
    return target instanceof TriggerBlockMemberTypeClass;
};

