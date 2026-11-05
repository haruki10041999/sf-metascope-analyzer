import { AnonymousBlockMemberContext } from '@apexdevtools/apex-parser';

import { MemberTypeClass } from '.';

import {
    AnonymousMemberDeclarationTypeClass,
    DeclarationVisitor,
    isAnonymousMemberDeclarationType,
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

export class AnonymousBlockMemberTypeClass extends MemberTypeClass<
    'anonymousBlockMember',
    AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass
> {
    private constructor(
        value: AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('anonymousBlockMember', value, modifier);
    }

    static create(ctx: AnonymousBlockMemberContext): AnonymousBlockMemberTypeClass {
        if (!ctx.anonymousMemberDeclaration() && !ctx.statement()) {
            throw new Error('値が異常です。AnonymousBlockMemberContext: ' + ctx.getText());
        }

        return new AnonymousBlockMemberTypeClass(
            ctx.anonymousMemberDeclaration()
                ? visitNode(
                      new DeclarationVisitor(),
                      ctx.anonymousMemberDeclaration(),
                      isAnonymousMemberDeclarationType,
                      'anonymousMemberDeclaration',
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

export const isAnonymousBlockMemberType = (
    target: ApexCommonTypeClass<string>,
): target is AnonymousBlockMemberTypeClass => {
    return target instanceof AnonymousBlockMemberTypeClass;
};
