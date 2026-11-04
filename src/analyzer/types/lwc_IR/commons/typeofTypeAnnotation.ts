import { isTypeofTypeAnnotation, type TypeofTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeofTypeAnnotationTypeClass extends LwcCommonTypeClass<'typeofTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('typeofTypeAnnotation', originalSource);
    }

    static create(
        target: TypeofTypeAnnotation,
        originalSource: string,
    ): TypeofTypeAnnotationTypeClass {
        throw new Error('TypeofTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const typeofTypeAnnotationTypePair: EvaluatePair<
    TypeofTypeAnnotation,
    TypeofTypeAnnotationTypeClass
> = makeEvaluatePair(isTypeofTypeAnnotation, (target, originalSource) =>
    TypeofTypeAnnotationTypeClass.create(target, originalSource),
);

export const isTypeofTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeofTypeAnnotationTypeClass => target instanceof TypeofTypeAnnotationTypeClass;
