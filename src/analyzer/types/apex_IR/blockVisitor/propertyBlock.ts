import { PropertyBlockContext } from '@apexdevtools/apex-parser';

import {
    GetterTypeClass,
    SetterTypeClass,
    BlockTypeClass,
    BlockVisitor,
    isGetterType,
    isSetterType,
} from '.';

import {
    NormalModifierTypeClass,
    ModifierVisitor,
    isNormalModifierType,
    ModifierTypeClass,
} from '../modifierVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class PropertyBlockTypeClass extends BlockTypeClass<GetterTypeClass | SetterTypeClass> {
    private modifier: NormalModifierTypeClass[] = [];
    private constructor(
        value: GetterTypeClass | SetterTypeClass | null,
        modifier: NormalModifierTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('propertyBlock', value, errorClasses);
        this.modifier = modifier;
    }

    static create(ctx: PropertyBlockContext): PropertyBlockTypeClass {
        if (!ctx.getter() && !ctx.setter()) {
            throw new Error('値が異常です。GetterContext: ' + ctx.getText());
        }

        let value: GetterTypeClass | SetterTypeClass | null = null;
        const modifier: NormalModifierTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.getter()) {
            const blockTypeClass = new BlockVisitor().visit(ctx.getter());
            if (isGetterType(blockTypeClass)) {
                value = blockTypeClass;
            } else if (isErrorType(blockTypeClass)) {
                errorClasses['value'] = blockTypeClass;
            }
        }

        if (ctx.setter()) {
            const blockTypeClass = new BlockVisitor().visit(ctx.setter());
            if (isSetterType(blockTypeClass)) {
                value = blockTypeClass;
            } else if (isErrorType(blockTypeClass)) {
                errorClasses['value'] = blockTypeClass;
            }
        }

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            ctx.modifier_list().forEach((modifierCtx, index) => {
                const modifierTypeClass = new ModifierVisitor().visit(modifierCtx);
                if (isNormalModifierType(modifierTypeClass)) {
                    modifier.push(modifierTypeClass);
                } else if (isErrorType(modifierTypeClass)) {
                    errorClasses[`modifier_${index}`] = modifierTypeClass;
                }
            });
        }

        return new PropertyBlockTypeClass(value, modifier, errorClasses);
    }

    getModifier(): NormalModifierTypeClass[] {
        return this.modifier;
    }
}

export const isPropertyBlockType = (target: CommonTypeClass): target is PropertyBlockTypeClass => {
    return target instanceof PropertyBlockTypeClass;
};
