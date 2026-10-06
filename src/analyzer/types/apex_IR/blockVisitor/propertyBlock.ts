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
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class PropertyBlockTypeClass extends BlockTypeClass<GetterTypeClass | SetterTypeClass> {
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[] = [];
    private constructor(
        value: GetterTypeClass | SetterTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
    ) {
        super('propertyBlock', value);
        this.modifier = modifier;
    }

    static create(ctx: PropertyBlockContext): PropertyBlockTypeClass {
        if (!ctx.getter() && !ctx.setter()) {
            throw new Error('値が異常です。GetterContext: ' + ctx.getText());
        }

        return new PropertyBlockTypeClass(
            isValidClass(
                ctx.getter()
                    ? new BlockVisitor().visit(ctx.getter())
                    : new BlockVisitor().visit(ctx.setter()),
                ctx.getter() ? isGetterType : isSetterType,
                'value',
            ),
            isValidClassList(
                ctx.modifier_list(),
                (modifierCtx) => new ModifierVisitor().visit(modifierCtx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isPropertyBlockType = (target: CommonTypeClass): target is PropertyBlockTypeClass => {
    return target instanceof PropertyBlockTypeClass;
};
