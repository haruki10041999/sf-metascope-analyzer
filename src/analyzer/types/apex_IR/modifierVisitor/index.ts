import { AnnotationContext, ModifierContext } from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ModifierTypeClass } from './base';

import { AnnotationTypeClass } from './annotation';
import { NormalModifierTypeClass } from './normal';

import { CommonVisitor } from '../commonVisitor';

export { isAnnotationType, AnnotationTypeClass } from './annotation';
export { isNormalModifierType, NormalModifierTypeClass } from './normal';

export class ModifierVisitor extends CommonVisitor<ModifierTypeClass<unknown>> {
    visitModifier(ctx: ModifierContext) {
        return NormalModifierTypeClass.create(ctx);
    }

    visitAnnotation(ctx: AnnotationContext) {
        return AnnotationTypeClass.create(ctx);
    }
}
