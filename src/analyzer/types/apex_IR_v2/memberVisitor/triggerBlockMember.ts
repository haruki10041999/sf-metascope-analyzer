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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class TriggerBlockMemberTypeClass extends MemberTypeClass<
    'triggerBlockMember',
    TriggerMemberDeclarationTypeClass | NormalStatementTypeClass
> {
    private constructor(
        value: TriggerMemberDeclarationTypeClass | NormalStatementTypeClass | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('triggerBlockMember', value, modifier);
    }

    static create(ctx: TriggerBlockMemberContext): TriggerBlockMemberTypeClass {
        if (!ctx.triggerMemberDeclaration() && !ctx.statement()) {
            throw new Error('値が異常です。TriggerBlockMemberContext: ' + ctx.getText());
        }

        return new TriggerBlockMemberTypeClass(
            ctx.triggerMemberDeclaration()
                ? visitNode(
                      new DeclarationVisitor(),
                      ctx.triggerMemberDeclaration(),
                      isTriggerMemberDeclarationType,
                      'triggerMemberDeclaration',
                  )
                : visitNode(
                      new StatementVisitor(),
                      ctx.statement(),
                      isNormalStatementType,
                      'statement',
                  ),
            visitNodeList(
                new ModifierVisitor(),
                ctx.modifier_list(),
                isNormalModifierType,
                'modifier',
            ),
        );
    }
}

export const isTriggerBlockMemberType = (
    target: ApexCommonTypeClass<string>,
): target is TriggerBlockMemberTypeClass => {
    return target instanceof TriggerBlockMemberTypeClass;
};
