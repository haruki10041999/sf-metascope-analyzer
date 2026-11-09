import { TriggerBlockMemberContext } from '@apexdevtools/apex-parser';

import { TriggerMemberDeclarationTypeClass } from '../declarationVisitor';
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

/** 文法は `modifier* triggerMemberDeclaration | statement`。修飾子は宣言の側にだけ付く */
export type TriggerBlockMemberType = TypeField<'triggerBlockMember'> &
    (
        | {
              kind: 'declaration';
              modifiers: ModifierTypeClass[];
              declaration: TriggerMemberDeclarationTypeClass;
          }
        | { kind: 'statement'; statement: StatementTypeClass }
    );

export class TriggerBlockMemberTypeClass extends ApexCommonTypeClass<
    'triggerBlockMember',
    TriggerBlockMemberType
> {
    private constructor(fields: FieldsOf<TriggerBlockMemberType>, sourceSpan: SourceSpan) {
        super('triggerBlockMember', fields, sourceSpan);
    }

    static create(ctx: TriggerBlockMemberContext): TriggerBlockMemberTypeClass {
        if (ctx.triggerMemberDeclaration()) {
            return new TriggerBlockMemberTypeClass(
                {
                    kind: 'declaration',
                    modifiers: createNodeList(
                        ctx.modifier_list(),
                        (c) => ModifierTypeClass.create(c),
                        'modifier',
                    ),
                    declaration: createNode(
                        ctx.triggerMemberDeclaration(),
                        (c) => TriggerMemberDeclarationTypeClass.create(c),
                        'triggerMemberDeclaration',
                    ),
                },
                getSourceSpan(ctx),
            );
        }

        return new TriggerBlockMemberTypeClass(
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

    getKind(): TriggerBlockMemberType['kind'] {
        return this.getFields().kind;
    }
}

export const isTriggerBlockMemberType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TriggerBlockMemberTypeClass => {
    return isSpicifyApexCommonTypeClass('triggerBlockMember', target);
};
