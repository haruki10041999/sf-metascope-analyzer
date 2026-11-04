import { PropertyBlockContext } from '@apexdevtools/apex-parser';

import {
    GetterTypeClass,
    SetterTypeClass,
    BlockTypeClass,
    BlockVisitor,
    isGetterType,
    isSetterType,
} from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export class PropertyBlockTypeClass extends BlockTypeClass<
    'propertyBlock',
    GetterTypeClass | SetterTypeClass
> {
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[] = [];
    private constructor(
        value: GetterTypeClass | SetterTypeClass | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('propertyBlock', value);
        this.modifier = modifier;
    }

    static create(ctx: PropertyBlockContext): PropertyBlockTypeClass {
        if (!ctx.getter() && !ctx.setter()) {
            throw new Error('値が異常です。GetterContext: ' + ctx.getText());
        }

        return new PropertyBlockTypeClass(
            isApexValidClass<GetterTypeClass | SetterTypeClass>(
                ctx.getter()
                    ? new BlockVisitor().visit(ctx.getter())
                    : new BlockVisitor().visit(ctx.setter()),
                ctx.getter() ? isGetterType : isSetterType,
                'value',
            ),
            isApexValidClassList(
                ctx.modifier_list(),
                (modifierCtx) => new ModifierVisitor().visit(modifierCtx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isPropertyBlockType = (
    target: ApexCommonTypeClass<string>,
): target is PropertyBlockTypeClass => {
    return target instanceof PropertyBlockTypeClass;
};
