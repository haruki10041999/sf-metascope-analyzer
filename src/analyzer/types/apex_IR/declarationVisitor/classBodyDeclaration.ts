import { ClassBodyDeclarationContext } from '@apexdevtools/apex-parser';

import {
    MemberDeclarationTypeClass,
    DeclarationTypeClass,
    DeclarationVisitor,
    isMemberDeclarationType,
} from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { CommonTypeClass, ErrorTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class ClassBodyDeclarationTypeClass extends DeclarationTypeClass<
    MemberDeclarationTypeClass | NormalBlockTypeClass | null
> {
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[];
    private isStatic: boolean = false;

    private constructor(
        value: MemberDeclarationTypeClass | NormalBlockTypeClass | ErrorTypeClass | null,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
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

        let value: MemberDeclarationTypeClass | NormalBlockTypeClass | ErrorTypeClass | null = null;
        if (ctx.memberDeclaration()) {
            value = isValidClass(
                new DeclarationVisitor().visit(ctx.memberDeclaration()),
                isMemberDeclarationType,
                'memberDeclaration',
            );
        } else if (ctx.block()) {
            value = isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block');
        }

        // 単独の `;` は文法上許される空宣言なので value は null
        return new ClassBodyDeclarationTypeClass(
            value,
            isValidClassList(
                ctx.modifier_list(),
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier',
            ),
            Boolean(ctx.STATIC()),
        );
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }

    getIsStatic(): boolean {
        return this.isStatic;
    }
}

export const isClassBodyDeclarationType = (
    target: CommonTypeClass,
): target is ClassBodyDeclarationTypeClass => target instanceof ClassBodyDeclarationTypeClass;
