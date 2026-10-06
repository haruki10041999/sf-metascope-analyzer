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
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class AnonymousBlockMemberTypeClass extends MemberTypeClass<
    AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass
> {
    private constructor(
        value: AnonymousMemberDeclarationTypeClass | NormalStatementTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
    ) {
        super('anonymousBlockMember', value, modifier);
    }

    static create(ctx: AnonymousBlockMemberContext): AnonymousBlockMemberTypeClass {
        if (!ctx.anonymousMemberDeclaration() && !ctx.statement()) {
            throw new Error('値が異常です。AnonymousBlockMemberContext: ' + ctx.getText());
        }

        return new AnonymousBlockMemberTypeClass(
            ctx.anonymousMemberDeclaration()
                ? isValidClass(
                      new DeclarationVisitor().visit(ctx.anonymousMemberDeclaration()),
                      isAnonymousMemberDeclarationType,
                      'anonymousMemberDeclaration',
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

export const isAnonymousBlockMemberType = (
    target: CommonTypeClass,
): target is AnonymousBlockMemberTypeClass => {
    return target instanceof AnonymousBlockMemberTypeClass;
};

