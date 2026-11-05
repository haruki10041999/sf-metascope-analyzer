import { isStringTypeAnnotation, type StringTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class StringTypeAnnotationTypeClass extends LwcCommonTypeClass<'stringTypeAnnotation'> {
    private constructor() {
        super('stringTypeAnnotation');
    }

    static create(
        _target: StringTypeAnnotation,
        _originalSource: string,
    ): StringTypeAnnotationTypeClass {
        return new StringTypeAnnotationTypeClass();
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
