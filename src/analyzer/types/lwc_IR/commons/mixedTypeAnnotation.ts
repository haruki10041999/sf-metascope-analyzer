import { isMixedTypeAnnotation, type MixedTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class MixedTypeAnnotationTypeClass extends LwcCommonTypeClass<'mixedTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('mixedTypeAnnotation', originalSource);
    }

    static create(
        target: MixedTypeAnnotation,
        originalSource: string,
    ): MixedTypeAnnotationTypeClass {
        throw new Error('MixedTypeAnnotationTypeClass.create is not implemented: ' + target.type);
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
