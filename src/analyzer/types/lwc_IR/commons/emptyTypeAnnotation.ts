import { isEmptyTypeAnnotation, type EmptyTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EmptyTypeAnnotationTypeClass extends LwcCommonTypeClass<'emptyTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('emptyTypeAnnotation', originalSource);
    }

    static create(
        target: EmptyTypeAnnotation,
        originalSource: string,
    ): EmptyTypeAnnotationTypeClass {
        throw new Error('EmptyTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const emptyTypeAnnotationTypePair: EvaluatePair<
    EmptyTypeAnnotation,
    EmptyTypeAnnotationTypeClass
> = makeEvaluatePair(isEmptyTypeAnnotation, (target, originalSource) =>
    EmptyTypeAnnotationTypeClass.create(target, originalSource),
);

export const isEmptyTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is EmptyTypeAnnotationTypeClass => target instanceof EmptyTypeAnnotationTypeClass;
