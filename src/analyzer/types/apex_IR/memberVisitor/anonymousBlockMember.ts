import { AnonymousBlockMemberContext } from '@apexdevtools/apex-parser';

import { AnonymousMemberDeclarationTypeClass } from '../declarationVisitor';
import { StatementTypeClass } from '../statementVisitor';
import { ModifierTypeClass } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** 文法は `modifier* anonymousMemberDeclaration | statement`。修飾子は宣言の側にだけ付く */
export type AnonymousBlockMemberType = TypeField<'anonymousBlockMember'> &
    (
        | {
              kind: 'declaration';
              modifiers: ModifierTypeClass[];
              declaration: AnonymousMemberDeclarationTypeClass;
          }
        | { kind: 'statement'; statement: StatementTypeClass }
    );

export class AnonymousBlockMemberTypeClass extends ApexCommonTypeClass<
    'anonymousBlockMember',
    AnonymousBlockMemberType
> {
    private constructor(fields: FieldsOf<AnonymousBlockMemberType>, sourceSpan: SourceSpan) {
        super('anonymousBlockMember', fields, sourceSpan);
    }

    static create(ctx: AnonymousBlockMemberContext): AnonymousBlockMemberTypeClass {
        if (ctx.anonymousMemberDeclaration()) {
            return new AnonymousBlockMemberTypeClass(
                {
                    kind: 'declaration',
                    modifiers: createNodeList(
                        ctx.modifier_list(),
                        (c) => ModifierTypeClass.create(c),
                        'modifier',
                    ),
                    declaration: createNode(
                        ctx.anonymousMemberDeclaration(),
                        (c) => AnonymousMemberDeclarationTypeClass.create(c),
                        'anonymousMemberDeclaration',
                    ),
                },
                getSourceSpan(ctx),
            );
        }

        return new AnonymousBlockMemberTypeClass(
            {
                kind: 'statement',
                statement: createNode(
                    ctx.statement(),
                    (c) => StatementTypeClass.create(c),
                    'statement',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getKind(): AnonymousBlockMemberType['kind'] {
        return this.getFields().kind;
    }
}

export const isAnonymousBlockMemberType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnonymousBlockMemberTypeClass => {
    return isSpicifyApexCommonTypeClass('anonymousBlockMember', target);
};
