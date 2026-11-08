import { PropertyBlockContext } from '@apexdevtools/apex-parser';

import { GetterTypeClass, SetterTypeClass } from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type PropertyBlockType = TypeField<'propertyBlock'> & {
    block: GetterTypeClass | SetterTypeClass;
    modifiers: NormalModifierTypeClass[];
};

export class PropertyBlockTypeClass extends ApexCommonTypeClass<
    'propertyBlock',
    PropertyBlockType
> {
    private constructor(
        block: GetterTypeClass | SetterTypeClass,
        modifiers: NormalModifierTypeClass[],
        sourceSpan: SourceSpan,
    ) {
        super('propertyBlock', { block: block, modifiers: modifiers }, sourceSpan);
    }

    static create(ctx: PropertyBlockContext): PropertyBlockTypeClass {
        const modifiers = ctx.modifier_list().map((m) => NormalModifierTypeClass.create(m));

        if (ctx.getter()) {
            return new PropertyBlockTypeClass(
                GetterTypeClass.create(ctx.getter()),
                modifiers,
                getSourceSpan(ctx),
            );
        } else {
            return new PropertyBlockTypeClass(
                SetterTypeClass.create(ctx.setter()),
                modifiers,
                getSourceSpan(ctx),
            );
        }
    }
}

export const isPropertyBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PropertyBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('propertyBlock', target);
};
