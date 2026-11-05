import { ClassBodyDeclarationContext } from '@apexdevtools/apex-parser';

import {
    MemberDeclarationTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isMemberDeclarationType,
} from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class ClassBodyDeclarationTypeClass extends DeclarationTypeClass<
    'classBodyDeclaration',
    MemberDeclarationTypeClass | NormalBlockTypeClass | null
> {
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[];
    private isStatic: boolean = false;

    private constructor(
        value: MemberDeclarationTypeClass | NormalBlockTypeClass | ApexErrorTypeClass | null,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
        isStatic: boolean,
    ) {
        super('classBodyDeclaration', value);
        this.modifier = modifier;
        this.isStatic = isStatic;
    }

    static create(ctx: ClassBodyDeclarationContext): ClassBodyDeclarationTypeClass {
        if (!ctx.memberDeclaration() && !ctx.block() && !ctx.SEMI()) {
            throw new Error('値が異常です。ClassBodyDeclarationContext: ' + ctx.getText());
        }

        let value: MemberDeclarationTypeClass | NormalBlockTypeClass | ApexErrorTypeClass | null =
            null;
        if (ctx.memberDeclaration()) {
            value = visitNode(
                new DeclarationVisitor(),
                ctx.memberDeclaration(),
                isMemberDeclarationType,
                'memberDeclaration',
            );
        } else if (ctx.block()) {
            value = visitNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block');
        }

        // 単独の `;` は文法上許される空宣言なので value は null
        return new ClassBodyDeclarationTypeClass(
            value,
            visitNodeList(
                new ModifierVisitor(),
                ctx.modifier_list(),
                isNormalModifierType,
                'modifier',
            ),
            Boolean(ctx.STATIC()),
        );
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }

    getIsStatic(): boolean {
        return this.isStatic;
    }
}

export const isClassBodyDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is ClassBodyDeclarationTypeClass => target instanceof ClassBodyDeclarationTypeClass;
