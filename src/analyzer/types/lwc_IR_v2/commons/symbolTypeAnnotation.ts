import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isSymbolTypeAnnotation, type SymbolTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type SymbolTypeAnnotationFields = TypeField<'symbolTypeAnnotation'>;

export class SymbolTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'symbolTypeAnnotation',
    SymbolTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('symbolTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: SymbolTypeAnnotation,
        originalSource: string,
    ): SymbolTypeAnnotationTypeClass {
        return new SymbolTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const symbolTypeAnnotationTypePair: EvaluatePair<
    SymbolTypeAnnotation,
    SymbolTypeAnnotationTypeClass
> = makeEvaluatePair(isSymbolTypeAnnotation, (target, originalSource) =>
    SymbolTypeAnnotationTypeClass.create(target, originalSource),
);

export const isSymbolTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is SymbolTypeAnnotationTypeClass => target instanceof SymbolTypeAnnotationTypeClass;
