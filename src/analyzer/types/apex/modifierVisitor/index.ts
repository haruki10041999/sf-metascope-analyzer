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
        console.log('解析を開始します。' + 'ModifierContext:  ' + ctx.getText());
        const result = makeModifierType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ModifierContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAnnotation(ctx: AnnotationContext) {
        console.log('解析を開始します。' + 'AnnotationContext:  ' + ctx.getText());
        const result = makeAnnotationType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AnnotationContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
