import { isStringTypeAnnotation, type StringTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class StringTypeAnnotationTypeClass extends LwcCommonTypeClass<'stringTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('stringTypeAnnotation', originalSource);
    }

    static create(
        target: StringTypeAnnotation,
        originalSource: string,
    ): StringTypeAnnotationTypeClass {
        throw new Error('StringTypeAnnotationTypeClass.create is not implemented: ' + target.type);
    }
}

export const stringTypeAnnotationTypePair: EvaluatePair<
    StringTypeAnnotation,
    StringTypeAnnotationTypeClass
> = makeEvaluatePair(isStringTypeAnnotation, (target, originalSource) =>
    StringTypeAnnotationTypeClass.create(target, originalSource),
);

export const isStringTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is StringTypeAnnotationTypeClass => target instanceof StringTypeAnnotationTypeClass;
