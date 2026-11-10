import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isMixedTypeAnnotation, type MixedTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type MixedTypeAnnotationFields = TypeField<'mixedTypeAnnotation'>;

export class MixedTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'mixedTypeAnnotation',
    MixedTypeAnnotationFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('mixedTypeAnnotation', {}, sourceSpan);
    }

    static create(
        target: MixedTypeAnnotation,
        originalSource: string,
    ): MixedTypeAnnotationTypeClass {
        return new MixedTypeAnnotationTypeClass(getSourceSpan(target, originalSource));
    }
}

export const mixedTypeAnnotationTypePair: EvaluatePair<
    MixedTypeAnnotation,
    MixedTypeAnnotationTypeClass
> = makeEvaluatePair(isMixedTypeAnnotation, (target, originalSource) =>
    MixedTypeAnnotationTypeClass.create(target, originalSource),
);

export const isMixedTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is MixedTypeAnnotationTypeClass => target instanceof MixedTypeAnnotationTypeClass;
