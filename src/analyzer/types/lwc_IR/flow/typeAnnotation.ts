import { isTypeAnnotation, type TypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TypeAnnotationTypeClass extends LwcCommonTypeClass<'typeAnnotation'> {
    private constructor(originalSource: string) {
        super('typeAnnotation', originalSource);
    }

    static create(target: TypeAnnotation, originalSource: string): TypeAnnotationTypeClass {
        throw new Error('TypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const typeAnnotationTypePair: EvaluatePair<TypeAnnotation, TypeAnnotationTypeClass> =
    makeEvaluatePair(isTypeAnnotation, (target, originalSource) =>
        TypeAnnotationTypeClass.create(target, originalSource),
    );

export const isTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TypeAnnotationTypeClass => target instanceof TypeAnnotationTypeClass;
