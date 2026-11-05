import { isMixedTypeAnnotation, type MixedTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class MixedTypeAnnotationTypeClass extends LwcCommonTypeClass<'mixedTypeAnnotation'> {
    private constructor() {
        super('mixedTypeAnnotation');
    }

    static create(
        _target: MixedTypeAnnotation,
        _originalSource: string,
    ): MixedTypeAnnotationTypeClass {
        return new MixedTypeAnnotationTypeClass();
    }
}

export const mixedTypeAnnotationTypePair: EvaluatePair<
    MixedTypeAnnotation,
    MixedTypeAnnotationTypeClass
> = makeEvaluatePair(isMixedTypeAnnotation, (target, originalSource) =>
    MixedTypeAnnotationTypeClass.create(target, originalSource),
);

export const isMixedTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is MixedTypeAnnotationTypeClass => target instanceof MixedTypeAnnotationTypeClass;
