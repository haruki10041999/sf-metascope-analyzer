import {
    ApexParserBaseVisitor,
    AnnotationContext,
    ModifierContext,
} from '@apexdevtools/apex-parser';

import { AnnotationType, makeAnnotationType } from './annotation';
import { ModifierType as modifierType, makeModifierType } from './modifier';

export type ModifierType = modifierType | AnnotationType;

export class ModifierVisitor extends ApexParserBaseVisitor<ModifierType> {
    visitModifier(ctx: ModifierContext) {
        return makeModifierType(ctx);
    }

    visitAnnotation(ctx: AnnotationContext) {
        return makeAnnotationType(ctx);
    }
}
