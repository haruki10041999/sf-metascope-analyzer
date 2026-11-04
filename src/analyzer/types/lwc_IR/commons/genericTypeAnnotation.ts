import { isGenericTypeAnnotation, type GenericTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class GenericTypeAnnotationTypeClass extends LwcCommonTypeClass<'genericTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('genericTypeAnnotation', originalSource);
    }

    static create(
        target: GenericTypeAnnotation,
        originalSource: string,
    ): GenericTypeAnnotationTypeClass {
        throw new Error('GenericTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const genericTypeAnnotationTypePair: EvaluatePair<
    GenericTypeAnnotation,
    GenericTypeAnnotationTypeClass
> = makeEvaluatePair(isGenericTypeAnnotation, (target, originalSource) =>
    GenericTypeAnnotationTypeClass.create(target, originalSource),
);

export const isGenericTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is GenericTypeAnnotationTypeClass => target instanceof GenericTypeAnnotationTypeClass;
