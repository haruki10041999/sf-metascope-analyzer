import { isSymbolTypeAnnotation, type SymbolTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SymbolTypeAnnotationTypeClass extends LwcCommonTypeClass<'symbolTypeAnnotation'> {
    private constructor() {
        super('symbolTypeAnnotation');
    }

    static create(
        _target: SymbolTypeAnnotation,
        _originalSource: string,
    ): SymbolTypeAnnotationTypeClass {
        return new SymbolTypeAnnotationTypeClass();
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
