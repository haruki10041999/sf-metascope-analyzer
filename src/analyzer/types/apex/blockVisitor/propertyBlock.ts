import { PropertyBlockContext } from '@apexdevtools/apex-parser';

import { ModifierType, makeModifierType } from '../modifier';
import { GetterType, makeGetterType } from '../getter';
import { SetterType, makeSetterType } from '../setter';

export type PropertyBlockType = {
    type: 'propertyBlock';
    getter?: Omit<GetterType, 'type'>;
    setter?: Omit<SetterType, 'type'>;
    modifiers?: Omit<ModifierType, 'type'>[];
};

export const makePropertyBlockType = (ctx: PropertyBlockContext): PropertyBlockType => {
    const propertyBlockType: PropertyBlockType = { type: 'propertyBlock' };
    if (ctx.getter()) {
        const { type: _, ...getterType } = makeGetterType(ctx.getter());
        propertyBlockType.getter = getterType;
    }
    if (ctx.setter()) {
        const { type: _, ...setterType } = makeSetterType(ctx.setter());
        propertyBlockType.setter = setterType;
    }
    if (ctx.modifier_list()) {
        propertyBlockType.modifiers = ctx.modifier_list().map((modifier) => {
            const { type: _, ...modifierType } = makeModifierType(modifier);
            return modifierType;
        });
    }
    return propertyBlockType;
};
