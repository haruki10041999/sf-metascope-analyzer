import { isThisTypeAnnotation, type ThisTypeAnnotation } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ThisTypeAnnotationTypeClass extends LwcCommonTypeClass<'thisTypeAnnotation'> {
    private constructor(originalSource: string) {
        super('thisTypeAnnotation', originalSource);
    }

    static create(target: ThisTypeAnnotation, originalSource: string): ThisTypeAnnotationTypeClass {
        throw new Error('ThisTypeAnnotationTypeClass.create is not implemented: ' + target.type);
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
