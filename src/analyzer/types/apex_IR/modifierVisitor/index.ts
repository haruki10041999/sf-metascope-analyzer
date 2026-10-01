import {
    ApexParserBaseVisitor,
    AnnotationContext,
    ModifierContext,
} from '@apexdevtools/apex-parser';

import { AnnotationTypeClass } from './annotation';
import { NormalModifierTypeClass } from './normal';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isAnnotationType, AnnotationTypeClass } from './annotation';
export { isNormalModifierType, NormalModifierTypeClass } from './normal';

export class ModifierTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
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
