import { PropertyBlockContext } from '@apexdevtools/apex-parser';

import { ModifierType, ModifierVisitor } from '../modifierVisitor';
import { BlockType, BlockVisitor } from '.';

export type PropertyBlockType = {
    type: 'propertyBlock';
    block: {
        getter?: BlockType;
        setter?: BlockType;
        modifiers?: ModifierType[];
    };
};

export const makePropertyBlockType = (ctx: PropertyBlockContext): PropertyBlockType => {
    if (!ctx.getter() && !ctx.setter()) {
        throw new Error('値が異常です。PropertyBlockContext: ' + ctx.getText());
    }

    const block: {
        getter?: BlockType;
        setter?: BlockType;
        modifiers?: ModifierType[];
    } = {};
    if (ctx.getter()) {
        const getterType = new BlockVisitor().visit(ctx.getter());
        block.getter = getterType;
    }
    if (ctx.setter()) {
        const setterType = new BlockVisitor().visit(ctx.setter());
        block.setter = setterType;
    }
    if (ctx.modifier_list()) {
        block.modifiers = ctx.modifier_list().map((modifier) => {
            const modifierType = new ModifierVisitor().visit(modifier);
            return modifierType;
        });
    }
    return {
        type: 'propertyBlock',
        block: block,
    };
};
