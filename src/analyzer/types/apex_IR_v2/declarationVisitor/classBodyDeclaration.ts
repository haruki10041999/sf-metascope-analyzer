import { ClassBodyDeclarationContext } from '@apexdevtools/apex-parser';

import { MemberDeclarationTypeClass } from './memberDeclaration';

import { BlockTypeClass } from '../blockVisitor';
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

/**
 * クラスの本体の宣言 1 つ。文法は `SEMI | STATIC? block | modifier* memberDeclaration` の 3 通り
 * - empty: 単独の `;` (文法上許される空宣言)
 * - initializer: 初期化ブロック (`static { ... }` なら isStatic が true)
 * - member: 修飾子つきのメンバーの宣言
 */
export type ClassBodyDeclarationType = TypeField<'classBodyDeclaration'> &
    (
        | { kind: 'empty' }
        | { kind: 'initializer'; isStatic: boolean; block: BlockTypeClass }
        | {
              kind: 'member';
              modifiers: ModifierTypeClass[];
              declaration: MemberDeclarationTypeClass;
          }
    );

export class ClassBodyDeclarationTypeClass extends ApexCommonTypeClass<
    'classBodyDeclaration',
    ClassBodyDeclarationType
> {
    private constructor(fields: FieldsOf<ClassBodyDeclarationType>, sourceSpan: SourceSpan) {
        super('classBodyDeclaration', fields, sourceSpan);
    }

    static create(ctx: ClassBodyDeclarationContext): ClassBodyDeclarationTypeClass {
        return new ClassBodyDeclarationTypeClass(
            ClassBodyDeclarationTypeClass.createFields(ctx),
            getSourceSpan(ctx),
        );
    }

    private static createFields(
        ctx: ClassBodyDeclarationContext,
    ): FieldsOf<ClassBodyDeclarationType> {
        if (ctx.memberDeclaration()) {
            return {
                kind: 'member',
                modifiers: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
                declaration: createNode(
                    ctx.memberDeclaration(),
                    (c) => MemberDeclarationTypeClass.create(c),
                    'memberDeclaration',
                ),
            };
        }
        if (ctx.block()) {
            return {
                kind: 'initializer',
                isStatic: Boolean(ctx.STATIC()),
                block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
            };
        }
        return { kind: 'empty' };
    }

    getKind(): ClassBodyDeclarationType['kind'] {
        return this.getFields().kind;
    }
}

export const isClassBodyDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ClassBodyDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('classBodyDeclaration', target);
};
