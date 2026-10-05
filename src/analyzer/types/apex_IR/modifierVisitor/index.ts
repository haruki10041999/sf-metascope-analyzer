import { AnnotationContext, ModifierContext } from '@apexdevtools/apex-parser';

import { AnnotationTypeClass } from './annotation';
import { NormalModifierTypeClass } from './normal';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isAnnotationType, AnnotationTypeClass } from './annotation';
export { isNormalModifierType, NormalModifierTypeClass } from './normal';

export class ModifierTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isModifierTypeAll = (
    target: CommonTypeClass,
): target is ModifierTypeClass<unknown> => {
    return target instanceof ModifierTypeClass;
};

export class ModifierVisitor extends CommonVisitor<ModifierTypeClass<unknown>> {
    visitModifier(ctx: ModifierContext) {
        return NormalModifierTypeClass.create(ctx);
    }

    visitAnnotation(ctx: AnnotationContext) {
        return AnnotationTypeClass.create(ctx);
    }
}
