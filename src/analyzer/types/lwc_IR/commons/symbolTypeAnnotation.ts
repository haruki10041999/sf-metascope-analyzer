import { isSymbolTypeAnnotation, type SymbolTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SymbolTypeAnnotationTypeClass extends LwcCommonTypeClass<'symbolTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('symbolTypeAnnotation', originalSource);
    }

    static create(
        target: SymbolTypeAnnotation,
        originalSource: string,
    ): SymbolTypeAnnotationTypeClass {
        throw new Error('SymbolTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const symbolTypeAnnotationTypePair: EvaluatePair<
    SymbolTypeAnnotation,
    SymbolTypeAnnotationTypeClass
> = makeEvaluatePair(isSymbolTypeAnnotation, (target, originalSource) =>
    SymbolTypeAnnotationTypeClass.create(target, originalSource),
);

export const isSymbolTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is SymbolTypeAnnotationTypeClass => target instanceof SymbolTypeAnnotationTypeClass;
