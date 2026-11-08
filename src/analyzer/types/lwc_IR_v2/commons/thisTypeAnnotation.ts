import { isThisTypeAnnotation, type ThisTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ThisTypeAnnotationTypeClass extends LwcCommonTypeClass<'thisTypeAnnotation'> {
    private constructor() {
        super('thisTypeAnnotation');
    }

    static create(
        _target: ThisTypeAnnotation,
        _originalSource: string,
    ): ThisTypeAnnotationTypeClass {
        return new ThisTypeAnnotationTypeClass();
    }
}

export const thisTypeAnnotationTypePair: EvaluatePair<
    ThisTypeAnnotation,
    ThisTypeAnnotationTypeClass
> = makeEvaluatePair(isThisTypeAnnotation, (target, originalSource) =>
    ThisTypeAnnotationTypeClass.create(target, originalSource),
);

export const isThisTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is ThisTypeAnnotationTypeClass => target instanceof ThisTypeAnnotationTypeClass;
