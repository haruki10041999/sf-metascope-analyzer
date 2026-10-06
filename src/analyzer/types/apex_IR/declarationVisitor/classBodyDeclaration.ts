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
    MemberDeclarationTypeClass | NormalBlockTypeClass
> {
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[];
    private isStatic: boolean = false;

    private constructor(
        value: MemberDeclarationTypeClass | NormalBlockTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
        isStatic: boolean,
    ) {
        super('classBodyDeclaration', value);
        this.modifier = modifier;
        this.isStatic = isStatic;
    }

    static create(ctx: ClassBodyDeclarationContext): ClassBodyDeclarationTypeClass {
        if (!ctx.memberDeclaration() && !ctx.block()) {
            throw new Error('値が異常です。ClassBodyDeclarationContext: ' + ctx.getText());
        }

        return new ClassBodyDeclarationTypeClass(
            ctx.memberDeclaration()
                ? isValidClass(
                      new DeclarationVisitor().visit(ctx.memberDeclaration()),
                      isMemberDeclarationType,
                      'memberDeclaration',
                  )
                : isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
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
